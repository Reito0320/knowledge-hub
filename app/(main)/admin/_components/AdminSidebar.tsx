import Link from 'next/link';
import {
  FiActivity,
  FiHome,
  FiSettings,
} from 'react-icons/fi';

const navigationItems = [
  { label: 'ダッシュボード', icon: FiHome, isCurrent: true },
  { label: '操作履歴', icon: FiActivity, isCurrent: false },
  { label: '管理設定', icon: FiSettings, isCurrent: false },
];

const AdminSidebar = () => (
  <aside className="rounded-3xl border border-[#E7DED5] bg-[#FFFDFC] p-4 shadow-[0_18px_45px_rgba(73,52,38,0.06)] lg:sticky lg:top-24 lg:h-fit">
    <div className="border-b border-[#EEE7E0] px-3 pb-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B26936]">
        Admin console
      </p>
      <p className="mt-1 text-lg font-bold text-[#3F4854]">管理メニュー</p>
    </div>

    <nav aria-label="管理画面メニュー" className="mt-3 grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
      {navigationItems.map(({ label, icon: Icon, isCurrent }) => (
        <button
          key={label}
          type="button"
          aria-current={isCurrent ? 'page' : undefined}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-bold transition ${
            isCurrent
              ? 'bg-[#F4E9DE] text-[#8D512D]'
              : 'text-[#687482] hover:bg-[#F7F4F1] hover:text-[#3F4854]'
          }`}
        >
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          {label}
        </button>
      ))}
    </nav>

    <Link
      href="/"
      className="mt-4 flex items-center justify-center rounded-xl border border-[#DDD5CD] px-4 py-2.5 text-sm font-bold text-[#687482] transition hover:border-[#B26936]/40 hover:bg-[#FFF8F1] hover:text-[#8D512D]"
    >
      Knowledge-Hubへ戻る
    </Link>
  </aside>
);

export default AdminSidebar;
