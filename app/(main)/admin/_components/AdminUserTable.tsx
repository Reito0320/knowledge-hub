import {
  FiChevronDown,
  FiFilter,
  FiMoreHorizontal,
  FiSearch,
} from 'react-icons/fi';

const users = [
  {
    id: 'user-01',
    initials: '佐',
    name: '佐藤 花子',
    email: 'hanako.sato@example.com',
    department: '開発部',
    role: '管理者',
    status: '利用中',
    lastLogin: '本日 09:42',
  },
  {
    id: 'user-02',
    initials: '鈴',
    name: '鈴木 一郎',
    email: 'ichiro.suzuki@example.com',
    department: '営業部',
    role: '一般ユーザー',
    status: '利用中',
    lastLogin: '昨日 18:20',
  },
  {
    id: 'user-03',
    initials: '高',
    name: '高橋 美咲',
    email: 'misaki.takahashi@example.com',
    department: '人事部',
    role: '一般ユーザー',
    status: '承認待ち',
    lastLogin: '未ログイン',
  },
  {
    id: 'user-04',
    initials: '田',
    name: '田中 健',
    email: 'ken.tanaka@example.com',
    department: '未設定',
    role: '一般ユーザー',
    status: '停止中',
    lastLogin: '8月26日 14:08',
  },
];

const getStatusClassName = (status: string) => {
  if (status === '利用中') return 'bg-[#E9F2EA] text-[#527158]';
  if (status === '承認待ち') return 'bg-[#FBF0DE] text-[#9A672E]';
  return 'bg-[#F5E7E5] text-[#A3544E]';
};

const AdminUserTable = () => (
  <section className="mt-6 overflow-hidden rounded-3xl border border-[#E7DED5] bg-white shadow-[0_16px_40px_rgba(73,52,38,0.05)]">
    <header className="border-b border-[#EEE7E0] p-5 sm:p-6">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
        <div>
          <h2 className="text-lg font-bold text-[#3F4854]">ユーザー管理</h2>
          <p className="mt-1 text-sm text-[#817970]">
            アカウントの状態と権限を確認します。現在は静的なサンプル表示です。
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block min-w-0 sm:w-72">
            <span className="sr-only">名前またはメールアドレスで検索</span>
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#9A9189]"
            />
            <input
              type="search"
              placeholder="名前・メールアドレスで検索"
              className="h-10 w-full rounded-xl border border-[#DDD5CD] bg-[#FFFEFD] pl-9 pr-3 text-sm text-[#3F4854] outline-none transition placeholder:text-[#A69D95] focus:border-[#B26936] focus:ring-3 focus:ring-[#B26936]/10"
            />
          </label>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-[#DDD5CD] px-4 text-sm font-bold text-[#687482] transition hover:bg-[#F8F4F0]"
          >
            <FiFilter aria-hidden="true" />
            絞り込み
            <FiChevronDown aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>

    <div className="overflow-x-auto">
      <table className="min-w-[880px] w-full border-collapse text-left">
        <thead className="bg-[#FAF7F3] text-xs font-bold uppercase tracking-[0.08em] text-[#857C74]">
          <tr>
            <th className="px-6 py-3.5">ユーザー</th>
            <th className="px-4 py-3.5">部署</th>
            <th className="px-4 py-3.5">権限</th>
            <th className="px-4 py-3.5">状態</th>
            <th className="px-4 py-3.5">最終ログイン</th>
            <th className="px-6 py-3.5 text-right">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#F0EAE4]">
          {users.map((user) => (
            <tr key={user.id} className="transition hover:bg-[#FFFCF8]">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E9EFF5] text-sm font-bold text-[#456681]">
                    {user.initials}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-[#3F4854]">{user.name}</p>
                    <p className="mt-0.5 text-xs text-[#8A8179]">{user.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-[#687482]">{user.department}</td>
              <td className="px-4 py-4">
                <span className={user.role === '管理者' ? 'text-sm font-bold text-[#995E35]' : 'text-sm text-[#687482]'}>
                  {user.role}
                </span>
              </td>
              <td className="px-4 py-4">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusClassName(user.status)}`}>
                  {user.status}
                </span>
              </td>
              <td className="px-4 py-4 text-sm text-[#817970]">{user.lastLogin}</td>
              <td className="px-6 py-4 text-right">
                <button
                  type="button"
                  aria-label={`${user.name}の操作メニューを開く`}
                  title="API実装後に操作メニューを接続します"
                  className="inline-flex size-9 items-center justify-center rounded-lg text-[#7E756D] transition hover:bg-[#F4ECE5] hover:text-[#8D512D]"
                >
                  <FiMoreHorizontal aria-hidden="true" className="size-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <footer className="flex flex-col gap-3 border-t border-[#EEE7E0] px-5 py-4 text-sm text-[#817970] sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <p>全128件中 1〜4件を表示</p>
      <div className="flex gap-2">
        <button type="button" disabled className="rounded-lg border border-[#E2DAD2] px-3 py-1.5 opacity-45">
          前へ
        </button>
        <button type="button" className="rounded-lg border border-[#E2DAD2] px-3 py-1.5 transition hover:bg-[#F8F4F0]">
          次へ
        </button>
      </div>
    </footer>
  </section>
);

export default AdminUserTable;
