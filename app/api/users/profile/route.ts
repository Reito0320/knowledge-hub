import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const PATCH = async (request: NextRequest) => {
  const userId = await getCurrentUser();
  if (!userId)
    return NextResponse.json({ message: 'ログインが必要です。' }, { status: 401 });

  const body: unknown = await request.json();
  const departmentId =
    typeof body === 'object' && body && 'departmentId' in body
      ? body.departmentId
      : null;

  if (departmentId !== null && typeof departmentId !== 'string')
    return NextResponse.json({ message: '部署が正しくありません。' }, { status: 400 });

  if (departmentId) {
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true },
    });
    if (!department)
      return NextResponse.json({ message: '部署が見つかりません。' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { departmentId: departmentId || null },
    select: {
      id: true,
      name: true,
      email: true,
      photoUrl: true,
      department: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ message: 'プロフィールを更新しました。', user });
};
