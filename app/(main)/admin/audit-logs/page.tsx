import AdminSidebar from '../_components/AdminSidebar';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import type { AdminAuditAction, AdminAuditStatus, Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { FiActivity, FiSearch } from 'react-icons/fi';

const actionLabels: Record<AdminAuditAction, string> = {
  MFA_TOTP_RESET: 'MFA救済',
  USER_ROLE_CHANGED: '権限変更',
  USER_STATUS_CHANGED: '利用状態変更',
  USER_SESSION_REVOKED: 'セッション失効',
  DEPARTMENT_CREATED: '部署追加',
  DEPARTMENT_RENAMED: '部署名変更',
  DEPARTMENT_DELETED: '部署削除',
};

const statusLabels: Record<AdminAuditStatus, string> = {
  PENDING: '処理中',
  SUCCEEDED: '成功',
  FAILED: '失敗',
};

type Props = { searchParams: Promise<{ action?: string; status?: string }> };

const AdminAuditLogsPage = async ({ searchParams }: Props) => {
  await connection();
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/');
  const params = await searchParams;
  const action = params.action && params.action in actionLabels ? params.action as AdminAuditAction : '';
  const status = params.status && params.status in statusLabels ? params.status as AdminAuditStatus : '';
  const where: Prisma.AdminAuditLogWhereInput = {
    ...(action ? { action } : {}),
    ...(status ? { status } : {}),
  };
  const logs = await prisma.adminAuditLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  const ids = [...new Set(logs.flatMap((log) => [log.adminUserId, log.targetUserId]))];
  const users = await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, email: true } });
  const userMap = new Map(users.map((user) => [user.id, user]));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#FAF7F3] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#A66334]"><FiActivity /> Administration</p><h1 className="mt-2 text-3xl font-bold text-[#3F4854]">管理操作履歴</h1><p className="mt-2 text-sm text-[#817970]">管理者が実行した重要操作を最新100件まで確認できます。</p></div>
        <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
          <AdminSidebar current="audit-logs" />
          <section className="min-w-0 overflow-hidden rounded-3xl border border-[#E7DED5] bg-white">
            <form className="flex flex-wrap gap-2 border-b border-[#EEE7E0] p-5" action="/admin/audit-logs">
              <select name="action" defaultValue={action} className="h-10 rounded-xl border border-[#DDD5CD] px-3 text-sm"><option value="">すべての操作</option>{Object.entries(actionLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <select name="status" defaultValue={status} className="h-10 rounded-xl border border-[#DDD5CD] px-3 text-sm"><option value="">すべての結果</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <button className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#A66334] px-4 text-sm font-bold text-white"><FiSearch />絞り込む</button>
              <Link href="/admin/audit-logs" className="inline-flex h-10 items-center rounded-xl border border-[#DDD5CD] px-4 text-sm font-bold text-[#687482]">解除</Link>
            </form>
            {logs.length === 0 ? <p className="px-6 py-16 text-center text-sm text-[#817970]">操作履歴はありません。</p> : (
              <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[#FAF7F3] text-xs text-[#857C74]"><tr><th className="px-5 py-3">日時</th><th className="px-4 py-3">操作</th><th className="px-4 py-3">実行者</th><th className="px-4 py-3">対象</th><th className="px-4 py-3">理由</th><th className="px-4 py-3">結果</th></tr></thead><tbody className="divide-y divide-[#F0EAE4]">{logs.map((log) => { const actor = userMap.get(log.adminUserId); const target = userMap.get(log.targetUserId); return <tr key={log.id}><td className="whitespace-nowrap px-5 py-4 text-[#817970]">{log.createdAt.toLocaleString('ja-JP')}</td><td className="px-4 py-4 font-bold text-[#3F4854]">{actionLabels[log.action]}</td><td className="px-4 py-4">{actor?.name ?? log.adminUserId}</td><td className="px-4 py-4">{target?.name ?? target?.email ?? log.targetUserId}</td><td className="max-w-xs px-4 py-4 text-[#687482]">{log.reason}</td><td className="px-4 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${log.status === 'SUCCEEDED' ? 'bg-[#E8F2E9] text-[#527158]' : log.status === 'FAILED' ? 'bg-[#F6E7E5] text-[#A3544E]' : 'bg-[#FBF0DE] text-[#9A672E]'}`}>{statusLabels[log.status]}</span>{log.errorMessage && <p className="mt-2 max-w-xs text-xs text-[#A3544E]">{log.errorMessage}</p>}</td></tr>; })}</tbody></table></div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
};

export default AdminAuditLogsPage;
