import { adminSetUserEnabled } from '@/lib/AWS/admin-set-user-enabled';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { writeAdminAuditLog } from '@/lib/admin/write-admin-audit-log';

/**
 * CognitoとDBの両方でKnowledge-Hubの利用可否を切り替える。
 * Userと過去の投稿は削除しない。
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
      select: { id: true, status: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: '対象ユーザーが存在しません。' },
        { status: 404 },
      );
    }

    // 外部認証を先に切り替え、Cognito操作に失敗した場合はDBを変更しない。
    await adminSetUserEnabled(targetUser.id, status === 'ACTIVE');

    let updatedUser;
    try {
      updatedUser = await prisma.user.update({
        where: { id: targetUser.id },
        data: { status },
        select: { id: true, status: true },
      });
    } catch (databaseError) {
      // DB更新に失敗した場合は、可能な限りCognitoを変更前の状態へ戻す。
      try {
        await adminSetUserEnabled(
          targetUser.id,
          targetUser.status === 'ACTIVE',
        );
      } catch (rollbackError) {
        console.error('Cognitoの状態を復元できませんでした:', rollbackError);
      }
      throw databaseError;
    }

    await writeAdminAuditLog({
      action: 'USER_STATUS_CHANGED',
      adminUserId: currentAdmin.id,
      targetUserId: userId,
      reason: `利用状態を${status}へ変更`,
    });

    return NextResponse.json({
      message: 'ユーザーの利用状態を変更しました。',
      user: updatedUser,
    });
  } catch (error) {
    console.error('ユーザーの利用状態を変更できませんでした:', error);
    const errorName = error instanceof Error ? error.name : '';
    if (errorName === 'UserNotFoundException') {
      return NextResponse.json(
        { message: 'Cognitoに対象ユーザーが存在しません。' },
        { status: 404 },
      );
    }
    if (errorName === 'TooManyRequestsException') {
      return NextResponse.json(
        { message: '操作が集中しています。時間をおいて再実行してください。' },
        { status: 429 },
      );
    }
    return NextResponse.json(
      { message: 'ユーザーの利用状態を変更できませんでした。' },
      { status: 500 },
    );
  }
};
