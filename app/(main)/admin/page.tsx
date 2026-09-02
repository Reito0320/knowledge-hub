import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { FiBell, FiShield } from 'react-icons/fi';
import AdminSidebar from './_components/AdminSidebar';
import AdminSummaryCards from './_components/AdminSummaryCards';
import AdminUserTable from './_components/AdminUserTable';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/lib/generated/prisma/client';
import { createOptionalProfileImageViewUrl } from '@/lib/AWS/s3-presigned-url';

type AdminPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    role?: string | string[];
    status?: string | string[];
  }>;
};

const getFirstSearchParam = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

const AdminPage = async ({ searchParams }: AdminPageProps) => {
  // CookieとDBの最新roleを使うため、管理画面はリクエストごとに描画する。
  await connection();
  const admin = await getCurrentAdmin();
  // Headerの表示制御を回避してURLを直接入力されても、管理画面は表示しない。
  if (!admin) redirect('/');

  const params = await searchParams;
  const keyword = getFirstSearchParam(params.q).trim();
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

  // 一覧・検索件数・各権限の集計は互いに依存しないため並列で取得する。
  const [userRecords, filteredUserCount, totalUserCount, activeUserCount, pendingUserCount, suspendedUserCount] =
    await Promise.all([
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
      prisma.user.count({ where: { status: 'PENDING' } }),
      prisma.user.count({ where: { status: 'SUSPENDED' } }),
    ]);

  // DBにはS3のobjectKeyだけを保存し、画面を開くたびに表示用URLへ変換する。
  const users = await Promise.all(
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
  );

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#FAF7F3] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#A66334]">
              <FiShield aria-hidden="true" />
              Administration
            </div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#3F4854] sm:text-3xl">
              管理ダッシュボード
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#817970]">
              ユーザーの利用状況、権限、アカウント状態を安全に管理するための画面です。
            </p>
          </div>

          <button
            type="button"
            aria-label="管理通知を確認"
            className="relative flex size-11 items-center justify-center self-start rounded-xl border border-[#DDD5CD] bg-white text-[#687482] shadow-sm transition hover:bg-[#FFF8F1] hover:text-[#9A5A31] sm:self-auto"
          >
            <FiBell aria-hidden="true" className="size-5" />
            <span className="absolute right-2 top-2 size-2 rounded-full bg-[#C96E55] ring-2 ring-white" />
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <AdminSidebar />
          <div className="min-w-0">
            <AdminSummaryCards
              totalUserCount={totalUserCount}
              activeUserCount={activeUserCount}
              pendingUserCount={pendingUserCount}
              suspendedUserCount={suspendedUserCount}
            />
            <AdminUserTable
              users={users}
              currentAdminId={admin.id}
              keyword={keyword}
              selectedRole={selectedRole}
              selectedStatus={selectedStatus}
              totalCount={filteredUserCount}
            />
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPage;
