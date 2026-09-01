import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { connection } from 'next/server';
import { redirect } from 'next/navigation';
import { FiBell, FiShield } from 'react-icons/fi';
import AdminSidebar from './_components/AdminSidebar';
import AdminSummaryCards from './_components/AdminSummaryCards';
import AdminUserTable from './_components/AdminUserTable';

const AdminPage = async () => {
  // CookieとDBの最新roleを使うため、管理画面はリクエストごとに描画する。
  await connection();

  const admin = await getCurrentAdmin();

  // Headerの表示制御を回避してURLを直接入力されても、管理画面は表示しない。
  if (!admin) redirect('/');

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
            <AdminSummaryCards />
            <AdminUserTable />
          </div>
        </div>
      </div>
    </main>
  );
};

export default AdminPage;
