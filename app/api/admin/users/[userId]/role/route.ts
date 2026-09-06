import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { writeAdminAuditLog } from '@/lib/admin/write-admin-audit-log';

class AdminRoleUpdateError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * アプリ内のユーザー権限を変更する。
 * Cognitoのグループ・MFA・セッションには触れず、DBのUser.roleだけを更新する。
 */
export const PATCH = async (
  request: NextRequest,
  context: RouteContext<'/api/admin/users/[userId]/role'>,
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
      { message: '自分自身の管理者権限は変更できません。' },
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

  if (typeof body !== 'object' || body === null || !('role' in body)) {
    return NextResponse.json(
      { message: '変更後の権限を指定してください。' },
      { status: 400 },
    );
  }

  const role = body.role;
  if (role !== 'MEMBER' && role !== 'ADMIN') {
    return NextResponse.json(
      { message: '指定された権限が正しくありません。' },
      { status: 400 },
    );
  }

  try {
    const updatedUser = await prisma.$transaction(
      async (transaction) => {
        const targetUser = await transaction.user.findUnique({
          where: { id: userId },
          select: { id: true, role: true },
        });

        if (!targetUser) {
          throw new AdminRoleUpdateError('対象ユーザーが存在しません。', 404);
        }

        if (targetUser.role === role) return targetUser;

        if (targetUser.role === 'ADMIN' && role === 'MEMBER') {
          const adminCount = await transaction.user.count({
            where: { role: 'ADMIN' },
          });

          if (adminCount <= 1) {
            throw new AdminRoleUpdateError(
              '最後の管理者を一般メンバーへ変更することはできません。',
              409,
            );
          }
        }

        return transaction.user.update({
          where: { id: targetUser.id },
          data: { role },
          select: { id: true, role: true },
        });
      },
      { isolationLevel: 'Serializable' },
    );

    await writeAdminAuditLog({
      action: 'USER_ROLE_CHANGED',
      adminUserId: currentAdmin.id,
      targetUserId: userId,
      reason: `権限を${role}へ変更`,
    });

    return NextResponse.json({
      message: 'ユーザーの権限を変更しました。',
      user: updatedUser,
    });
  } catch (error) {
    if (error instanceof AdminRoleUpdateError) {
      return NextResponse.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error('ユーザー権限の変更に失敗しました:', error);
    return NextResponse.json(
      { message: 'ユーザーの権限を変更できませんでした。' },
      { status: 500 },
    );
  }
};
