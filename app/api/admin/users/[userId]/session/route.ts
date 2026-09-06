import { adminUserGlobalSignOut } from '@/lib/AWS/admin-user-global-sign-out';
import { writeAdminAuditLog } from '@/lib/admin/write-admin-audit-log';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (
  request: NextRequest,
  context: { params: Promise<{ userId: string }> },
) => {
  const admin = await getCurrentAdmin();
  if (!admin)
    return NextResponse.json({ message: '管理者権限が必要です。' }, { status: 403 });

  const { userId } = await context.params;
  if (userId === admin.id)
    return NextResponse.json({ message: '自分自身のセッションはこの画面から失効できません。' }, { status: 400 });

  let reason = '';
  try {
    const body: unknown = await request.json();
    if (typeof body === 'object' && body !== null && 'reason' in body && typeof body.reason === 'string') {
      reason = body.reason.trim();
    }
  } catch {
    return NextResponse.json({ message: 'リクエストの形式が正しくありません。' }, { status: 400 });
  }
  if (!reason || reason.length > 500)
    return NextResponse.json({ message: '理由を1〜500文字で入力してください。' }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!target)
    return NextResponse.json({ message: '対象ユーザーが存在しません。' }, { status: 404 });

  try {
    await adminUserGlobalSignOut(userId);
    await writeAdminAuditLog({
      action: 'USER_SESSION_REVOKED',
      adminUserId: admin.id,
      targetUserId: userId,
      reason,
    });
    return NextResponse.json({ message: '対象ユーザーの全セッションを失効しました。' });
  } catch (error) {
    console.error('全セッション失効に失敗しました:', error);
    return NextResponse.json({ message: 'Cognitoのセッションを失効できませんでした。' }, { status: 502 });
  }
};
