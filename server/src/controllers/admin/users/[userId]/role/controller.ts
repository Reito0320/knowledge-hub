import { AdminOnly } from '@/server/src/auth/auth.decorators';
import { Bind, Controller, Patch } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentAdmin } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';
import { writeAdminAuditLog } from '@/server/src/infrastructure/write-admin-audit-log';

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

@AdminOnly()
@Controller('admin/users/:userId/role')
export class AdminUsersUseridRoleController {
  @Patch()
  @Bind(WebRequest(), WebParams())
  async PATCH(
    request: Request,
    context: { params: Promise<{ userId: string }> },
  ) {
    const currentAdmin = await getCurrentAdmin();

    if (!currentAdmin) {
      return Response.json(
        { message: '管理者権限が必要です。' },
        { status: 403 },
      );
    }

    const { userId } = await context.params;

    if (userId === currentAdmin.id) {
      return Response.json(
        { message: '自分自身の管理者権限は変更できません。' },
        { status: 400 },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { message: 'リクエストの形式が正しくありません。' },
        { status: 400 },
      );
    }

    if (typeof body !== 'object' || body === null || !('role' in body)) {
      return Response.json(
        { message: '変更後の権限を指定してください。' },
        { status: 400 },
      );
    }

    const role = body.role;
    if (role !== 'MEMBER' && role !== 'ADMIN') {
      return Response.json(
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

      return Response.json({
        message: 'ユーザーの権限を変更しました。',
        user: updatedUser,
      });
    } catch (error) {
      if (error instanceof AdminRoleUpdateError) {
        return Response.json(
          { message: error.message },
          { status: error.status },
        );
      }

      console.error('ユーザー権限の変更に失敗しました:', error);
      return Response.json(
        { message: 'ユーザーの権限を変更できませんでした。' },
        { status: 500 },
      );
    }

  }
}
