import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiX } from 'react-icons/fi';
import AdminRoleControl from './AdminRoleControl';
import AdminStatusControl from './AdminStatusControl';
import AdminMfaRecoveryButton from './AdminMfaRecoveryButton';

type AdminUserListItem = {
  id: string;
  name: string;
  email: string;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  photoUrl: string | null;
  department: { name: string } | null;
  createdAt: Date;
};

type AdminUserTableProps = {
  users: AdminUserListItem[];
  currentAdminId: string;
  keyword: string;
  selectedRole: '' | 'MEMBER' | 'ADMIN';
  selectedStatus: '' | 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  totalCount: number;
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });

const AdminUserTable = ({ users, currentAdminId, keyword, selectedRole, selectedStatus, totalCount }: AdminUserTableProps) => (
  <section className="mt-6 overflow-hidden rounded-3xl border border-[#E7DED5] bg-white shadow-[0_16px_40px_rgba(73,52,38,0.05)]">
    <header className="border-b border-[#EEE7E0] p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-[#3F4854]">ユーザー管理</h2>
        <p className="mt-1 text-sm text-[#817970]">DBに登録されたアカウントを検索し、アプリ内権限を管理します。</p>

        <form className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_160px_160px_100px_40px]" action="/admin">
          <label className="relative block min-w-0 sm:col-span-2 xl:col-span-1">
            <span className="sr-only">名前またはメールアドレスで検索</span>
            <FiSearch aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9189]" />
            <input type="search" name="q" defaultValue={keyword} placeholder="名前・メールアドレスで検索" className="h-10 w-full rounded-xl border border-[#DDD5CD] bg-[#FFFEFD] pl-9 pr-3 text-sm text-[#3F4854] outline-none transition placeholder:text-[#A69D95] focus:border-[#B26936] focus:ring-3 focus:ring-[#B26936]/10" />
          </label>
          <select name="role" defaultValue={selectedRole} aria-label="権限で絞り込む" className="h-10 rounded-xl border border-[#DDD5CD] bg-white px-3 text-sm font-bold text-[#687482] outline-none transition focus:border-[#B26936]">
            <option value="">すべての権限</option>
            <option value="MEMBER">一般メンバー</option>
            <option value="ADMIN">管理者</option>
          </select>
          <select name="status" defaultValue={selectedStatus} aria-label="利用状態で絞り込む" className="h-10 rounded-xl border border-[#DDD5CD] bg-white px-3 text-sm font-bold text-[#687482] outline-none transition focus:border-[#B26936]">
            <option value="">すべての状態</option>
            <option value="PENDING">承認待ち</option>
            <option value="ACTIVE">利用可能</option>
            <option value="SUSPENDED">利用停止</option>
          </select>
          <button type="submit" className="inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#A66334] px-4 text-sm font-bold text-white transition hover:bg-[#86502D]">
            <FiSearch aria-hidden="true" />検索
          </button>
          <Link href="/admin" aria-label="検索条件を解除" title="検索条件を解除" className="inline-flex size-10 items-center justify-center justify-self-start rounded-xl border border-[#DDD5CD] text-[#817970] transition hover:bg-[#F8F4F0] sm:justify-self-end xl:justify-self-start">
            <FiX aria-hidden="true" />
          </Link>
        </form>
      </div>
    </header>

    {users.length === 0 ? (
      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-[#F4EEE8] text-[#9A633D]"><FiSearch aria-hidden="true" className="size-5" /></span>
        <h3 className="mt-4 font-bold text-[#3F4854]">条件に一致するユーザーがいません</h3>
        <p className="mt-2 text-sm text-[#817970]">キーワードを短くするか、権限の条件を変更してください。</p>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] border-collapse text-left">
          <thead className="bg-[#FAF7F3] text-xs font-bold uppercase tracking-[0.08em] text-[#857C74]">
            <tr><th className="px-6 py-3.5">ユーザー</th><th className="px-4 py-3.5">部署</th><th className="px-4 py-3.5">権限</th><th className="px-4 py-3.5">利用状態</th><th className="px-4 py-3.5">MFA</th><th className="px-4 py-3.5">登録日</th></tr>
          </thead>
          <tbody className="divide-y divide-[#F0EAE4]">
            {users.map((user) => {
              const initials = user.name.trim().slice(0, 1) || 'U';
              const isCurrentUser = user.id === currentAdminId;
              return (
                <tr key={user.id} className="transition hover:bg-[#FFFCF8]">
                  <td className="px-6 py-4"><div className="flex items-center gap-3">
                    <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E9EFF5] text-sm font-bold text-[#456681]">
                      {user.photoUrl ? (
                        <Image
                          src={user.photoUrl}
                          alt={`${user.name}のプロフィール画像`}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <span aria-hidden="true">{initials}</span>
                      )}
                    </span>
                    <div className="min-w-0"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold text-[#3F4854]">{user.name}</p>{isCurrentUser && <span className="shrink-0 rounded-full bg-[#F4E9DE] px-2 py-0.5 text-[10px] font-bold text-[#8D512D]">あなた</span>}</div><p className="mt-0.5 truncate text-xs text-[#8A8179]">{user.email}</p></div>
                  </div></td>
                  <td className="px-4 py-4 text-sm text-[#687482]">{user.department?.name ?? '未設定'}</td>
                  <td className="px-4 py-4"><AdminRoleControl userId={user.id} userName={user.name} currentRole={user.role} isCurrentUser={isCurrentUser} /></td>
                  <td className="px-4 py-4"><AdminStatusControl userId={user.id} userName={user.name} currentStatus={user.status} isCurrentUser={isCurrentUser} /></td>
                  <td className="px-4 py-4">
                    {user.role === 'MEMBER' && (
                      <AdminMfaRecoveryButton
                        userId={user.id}
                        userName={user.name}
                        userEmail={user.email}
                      />
                    )}
                    {user.role === 'ADMIN' && (
                      <span className="text-sm text-[#AAA099]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-sm text-[#817970]">{dateFormatter.format(user.createdAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    )}
    <footer className="border-t border-[#EEE7E0] px-5 py-4 text-sm text-[#817970] sm:px-6">{totalCount}件中 {users.length}件を表示</footer>
  </section>
);

export default AdminUserTable;
