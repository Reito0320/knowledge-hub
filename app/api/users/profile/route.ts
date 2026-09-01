import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createProfileImageViewUrl } from '@/lib/AWS/s3-presigned-url';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const PATCH = async (request: NextRequest) => {
  const userId = await getCurrentUser();
  if (!userId)
    return NextResponse.json(
      { message: 'ログインが必要です。' },
      { status: 401 },
    );

  const body: unknown = await request.json();
  const departmentId =
    typeof body === 'object' && body && 'departmentId' in body
      ? body.departmentId
      : null;
  const name =
    typeof body === 'object' &&
    body &&
    'name' in body &&
    typeof body.name === 'string'
      ? body.name.trim()
      : '';
  const jobTitle =
    typeof body === 'object' &&
    body &&
    'jobTitle' in body &&
    typeof body.jobTitle === 'string'
      ? body.jobTitle.trim()
      : '';
  const bio =
    typeof body === 'object' &&
    body &&
    'bio' in body &&
    typeof body.bio === 'string'
      ? body.bio.trim()
      : '';

  if (!name || name.length > 50)
    return NextResponse.json(
      { message: '表示名は1〜50文字で入力してください。' },
      { status: 400 },
    );
  if (jobTitle.length > 80 || bio.length > 500)
    return NextResponse.json(
      { message: '役職または自己紹介が長すぎます。' },
      { status: 400 },
    );

  if (departmentId !== null && typeof departmentId !== 'string')
    return NextResponse.json(
      { message: '部署が正しくありません。' },
      { status: 400 },
    );

  if (departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!department)
      return NextResponse.json(
        { message: '部署が見つかりません。' },
        { status: 400 },
      );
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name,
      jobTitle: jobTitle || null,
      bio: bio || null,
      departmentId: departmentId || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      photoObjectKey: true,
      jobTitle: true,
      bio: true,
      department: { select: { id: true, name: true } },
    },
  });

  let photoUrl: string | null = null;

  if (user.photoObjectKey) {
    photoUrl = await createProfileImageViewUrl(user.photoObjectKey);
  }

  return NextResponse.json({
    message: 'プロフィールを更新しました。',
    user: {
      ...user,
      photoObjectKey: undefined,
      photoUrl,
    },
  });
};
