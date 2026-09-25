import { prisma } from '@/server/src/infrastructure/prisma';
import type { Prisma, AdminAuditAction, AdminAuditStatus } from '@/lib/generated/prisma/client';
import { actionLabels, statusLabels } from '@/lib/contracts/audit';
export async function getAuditLogs(params: { action?: string; status?: string }) {
  const action = params.action && Object.hasOwn(actionLabels, params.action) ? params.action as AdminAuditAction : '';
  const status = params.status && Object.hasOwn(statusLabels, params.status) ? params.status as AdminAuditStatus : '';
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(status ? { status } : {}),
  };
  const logs = await prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  const ids = [...new Set(logs.flatMap((log) => [log.adminUserId, log.targetUserId]))];
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
  return { action, status, logs, users };
}
