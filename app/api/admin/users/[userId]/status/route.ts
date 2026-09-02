import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * DBのUser.statusを変更し、Knowledge-Hubの利用可否を切り替える。
 * CognitoユーザーやCognitoの認証設定は変更しない。
 */
export const PATCH = async (
  request: NextRequest,
  context: RouteContext<'/api/admin/users/[userId]/status'>,
) => {
  const currentAdmin = await getCurrentAdmin();
  if (!currentAdmin) {
    return NextResponse.json(
      { message: '管理者権限が必要です。' },
      { status: 403 },
    );
  }

  const { userId } = await context.params;
  if (userId === currentAdmin.id) {
    return NextResponse.json(
      { message: '自分自身の利用状態は変更できません。' },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: 'リクエストの形式が正しくありません。' },
      { status: 400 },
    );
  }

  if (typeof body !== 'object' || body === null || !('status' in body)) {
    return NextResponse.json(
      { message: '変更後の利用状態を指定してください。' },
      { status: 400 },
    );
  }

  const status = body.status;
  if (
    status !== 'PENDING' &&
    status !== 'ACTIVE' &&
    status !== 'SUSPENDED'
  ) {
    return NextResponse.json(
      { message: '指定された利用状態が正しくありません。' },
      { status: 400 },
    );
  }

  try {
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: '対象ユーザーが存在しません。' },
        { status: 404 },
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { status },
      select: { id: true, status: true },
    });

    return NextResponse.json({
      message: 'ユーザーの利用状態を変更しました。',
      user: updatedUser,
    });
  } catch (error) {
    console.error('ユーザーの利用状態を変更できませんでした:', error);
    return NextResponse.json(
      { message: 'ユーザーの利用状態を変更できませんでした。' },
      { status: 500 },
    );
  }
};
