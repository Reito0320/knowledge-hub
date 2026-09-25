import { prisma } from '@/server/src/infrastructure/prisma';
import { createOptionalProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';
import type { Prisma } from '@/lib/generated/prisma/client';
import { getAdminAnalytics } from '@/server/src/queries/admin-analytics';
const getFirstSearchParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? '' : value ?? '';
export async function getAdminDashboard(params: Record<string, string | string[] | undefined>, adminId: string) {
  const keyword = getFirstSearchParam(params.q).trim();
  const selectedTab = getFirstSearchParam(params.tab) === 'analytics' ? 'analytics' : 'users';
  const requestedRole = getFirstSearchParam(params.role);
  const selectedRole: '' | 'MEMBER' | 'ADMIN' =
    requestedRole === 'MEMBER' || requestedRole === 'ADMIN'
      ? requestedRole
      : '';
  const requestedStatus = getFirstSearchParam(params.status);
  let selectedStatus: '' | 'PENDING' | 'ACTIVE' | 'SUSPENDED' = '';
  if (
    requestedStatus === 'PENDING' ||
    requestedStatus === 'ACTIVE' ||
    requestedStatus === 'SUSPENDED'
  ) {
    selectedStatus = requestedStatus;
  }

  const userWhere: Prisma.UserWhereInput = {
    ...(selectedRole ? { role: selectedRole } : {}),
    ...(selectedStatus ? { status: selectedStatus } : {}),
    ...(keyword
      ? {
          OR: [
            { name: { contains: keyword, mode: 'insensitive' as const } },
            { email: { contains: keyword, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  // 通知バッジに必要な件数だけは、どちらのタブでも取得する。
  const [pendingUserCount, failedAuditCount] = await Promise.all([
    prisma.user.count({ where: { status: 'PENDING' } }),
    prisma.adminAuditLog.count({ where: { status: 'FAILED' } }),
  ]);

  // アナリティクスタブではユーザー100件とプロフィール画像URLを取得しない。
  const userDashboardData = selectedTab === 'users'
    ? await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        orderBy: [{ role: 'desc' }, { createdAt: 'desc' }],
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          photoObjectKey: true,
          createdAt: true,
          department: { select: { name: true } },
        },
      }),
      prisma.user.count({ where: userWhere }),
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ])
    : [[], 0, 0, 0, 0] as const;
  const [userRecords, filteredUserCount, totalUserCount, activeUserCount, suspendedUserCount] = userDashboardData;

  // DBにはS3のobjectKeyだけを保存し、画面を開くたびに表示用URLへ変換する。
  const users = selectedTab === 'users' ? await Promise.all(
    userRecords.map(async (user) => {
      const photoUrl = await createOptionalProfileImageViewUrl(
        user.photoObjectKey,
      );

      return {
        ...user,
        photoObjectKey: undefined,
        photoUrl,
      };
    }),
  ) : [];
  const analytics = selectedTab === 'analytics' ? await getAdminAnalytics() : null;

 return { admin: { id: adminId }, keyword, selectedTab, selectedRole, selectedStatus, pendingUserCount, failedAuditCount, users, filteredUserCount, totalUserCount, activeUserCount, suspendedUserCount, analytics };
}
