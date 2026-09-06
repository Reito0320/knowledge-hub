import { FiAlertCircle, FiPauseCircle, FiUserCheck, FiUsers } from 'react-icons/fi';
import Link from 'next/link';

type AdminSummaryCardsProps = {
  totalUserCount: number;
  activeUserCount: number;
  pendingUserCount: number;
  suspendedUserCount: number;
};

const AdminSummaryCards = ({
  totalUserCount,
  activeUserCount,
  pendingUserCount,
  suspendedUserCount,
}: AdminSummaryCardsProps) => {
  const summaries = [
    { label: '登録ユーザー', value: totalUserCount, note: 'すべてのアカウント', href: '/admin', icon: FiUsers, iconClassName: 'bg-[#E8F0F7] text-[#446783]' },
    { label: '利用可能', value: activeUserCount, note: 'アプリを利用できます', href: '/admin?status=ACTIVE', icon: FiUserCheck, iconClassName: 'bg-[#E8F2E9] text-[#527158]' },
    { label: '承認待ち', value: pendingUserCount, note: '管理者の確認が必要です', href: '/admin?status=PENDING', icon: FiAlertCircle, iconClassName: 'bg-[#FBF0DE] text-[#9A672E]' },
    { label: '利用停止', value: suspendedUserCount, note: 'アプリを利用できません', href: '/admin?status=SUSPENDED', icon: FiPauseCircle, iconClassName: 'bg-[#F6E7E5] text-[#A3544E]' },
  ];

  return (
    <section aria-label="ユーザー状況" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {summaries.map(({ label, value, note, href, icon: Icon, iconClassName }) => (
        <Link href={href} key={label} className="rounded-2xl border border-[#E7DED5] bg-white p-5 shadow-[0_12px_30px_rgba(73,52,38,0.05)] transition hover:border-[#C98A59]/45 hover:shadow-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#7C756F]">{label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-[#3F4854]">{value}</p>
            </div>
            <span className={`flex size-11 items-center justify-center rounded-2xl ${iconClassName}`}>
              <Icon aria-hidden="true" className="size-5" />
            </span>
          </div>
          <p className="mt-3 text-xs font-medium text-[#968B82]">{note}</p>
        </Link>
      ))}
    </section>
  );
};

export default AdminSummaryCards;
