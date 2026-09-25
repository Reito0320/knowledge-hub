import { AdminOnly } from '@/server/src/auth/auth.decorators';
import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { adminUserGlobalSignOut } from '@/server/src/infrastructure/aws/admin-user-global-sign-out';
import { writeAdminAuditLog } from '@/server/src/infrastructure/write-admin-audit-log';
import { getCurrentAdmin } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

@AdminOnly()
@Controller('admin/users/:userId/session')
export class AdminUsersUseridSessionController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(
    request: Request,
    context: { params: Promise<{ userId: string }> },
  ) {
    const admin = await getCurrentAdmin();
    if (!admin)
      return Response.json({ message: '管理者権限が必要です。' }, { status: 403 });

    const { userId } = await context.params;
    if (userId === admin.id)
      return Response.json({ message: '自分自身のセッションはこの画面から失効できません。' }, { status: 400 });

    let reason = '';
    try {
      const body: unknown = await request.json();
      if (typeof body === 'object' && body !== null && 'reason' in body && typeof body.reason === 'string') {
        reason = body.reason.trim();
      }
    } catch {
      return Response.json({ message: 'リクエストの形式が正しくありません。' }, { status: 400 });
    }
    if (!reason || reason.length > 500)
      return Response.json({ message: '理由を1〜500文字で入力してください。' }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!target)
      return Response.json({ message: '対象ユーザーが存在しません。' }, { status: 404 });

    try {
      await adminUserGlobalSignOut(userId);
      await writeAdminAuditLog({
        action: 'USER_SESSION_REVOKED',
        adminUserId: admin.id,
        targetUserId: userId,
        reason,
      });
      return Response.json({ message: '対象ユーザーの全セッションを失効しました。' });
    } catch (error) {
      console.error('全セッション失効に失敗しました:', error);
      return Response.json({ message: 'Cognitoのセッションを失効できませんでした。' }, { status: 502 });
    }

  }
}
