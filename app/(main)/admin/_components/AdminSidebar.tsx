import Link from 'next/link';
import {
  FiActivity,
  FiHome,
  FiSettings,
  FiArrowUpRight,
  FiCompass,
} from 'react-icons/fi';

const navigationItems = [
  { label: 'ダッシュボード', icon: FiHome, href: '/admin', key: 'dashboard' },
  { label: '操作履歴', icon: FiActivity, href: '/admin/audit-logs', key: 'audit-logs' },
  { label: '管理設定', icon: FiSettings, href: '/admin/settings', key: 'settings' },
];

const AdminSidebar = ({ current = 'dashboard' }: { current?: 'dashboard' | 'audit-logs' | 'settings' }) => (
  <aside className="rounded-3xl border border-[#E7DED5] bg-[#FFFDFC] p-4 shadow-[0_18px_45px_rgba(73,52,38,0.06)] lg:sticky lg:top-24 lg:h-fit">
    <div className="border-b border-[#EEE7E0] px-3 pb-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B26936]">
        Admin console
      </p>
      <p className="mt-1 text-lg font-bold text-[#3F4854]">管理メニュー</p>
    </div>

    <nav aria-label="管理画面メニュー" className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
      {navigationItems.map(({ label, icon: Icon, href, key }) => (
        <Link
          key={label}
          href={href}
          aria-current={current === key ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
            current === key
              ? 'bg-[#F4E9DE] text-[#8D512D]'
              : 'text-[#687482] hover:bg-[#F7F4F1] hover:text-[#3F4854]'
          }`}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>

    <Link
      href="/"
      className="group relative mt-5 block overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#1E3A5F_0%,#344E69_64%,#8B5937_135%)] p-4 text-white shadow-[0_12px_28px_rgba(30,58,95,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(30,58,95,0.26)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A66334]"
    >
      <span className="absolute -right-5 -top-7 size-20 rounded-full bg-white/10 transition group-hover:scale-125" />
      <span className="relative flex items-center gap-3 pr-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12 ring-1 ring-white/15"><FiCompass className="size-5" /></span>
        <span className="min-w-0"><span className="block whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em] text-white/65">Back to app</span><span className="mt-0.5 block whitespace-nowrap text-[13px] font-bold">Knowledge Hub</span><span className="mt-0.5 block whitespace-nowrap text-[10px] text-white/65">ナレッジへ戻る</span></span>
        <FiArrowUpRight className="absolute right-0 top-0 shrink-0 text-white/70 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </span>
    </Link>
  </aside>
);

export default AdminSidebar;
