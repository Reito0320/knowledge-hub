import type { AdminAuditAction, AdminAuditStatus } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';

type AuditLogInput = {
  action: AdminAuditAction;
  status?: AdminAuditStatus;
  adminUserId: string;
  targetUserId: string;
  reason: string;
  errorMessage?: string;
};

export const writeAdminAuditLog = async ({
  status = 'SUCCEEDED',
  ...input
}: AuditLogInput) => {
  try {
    return await prisma.adminAuditLog.create({
      data: {
        ...input,
        status,
        completedAt: status === 'PENDING' ? null : new Date(),
      },
    });
  } catch (error) {
    // 監査基盤の一時障害で、完了済みのCognito/DB操作を500扱いにしない。
    console.error('管理操作の監査ログを保存できませんでした:', error);
    return null;
  }
};
