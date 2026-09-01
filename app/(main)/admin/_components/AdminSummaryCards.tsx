import { FiAlertCircle, FiShield, FiUserCheck, FiUsers } from 'react-icons/fi';

const summaries = [
  {
    label: '登録ユーザー',
    value: '128',
    note: '前月比 +8名',
    icon: FiUsers,
    iconClassName: 'bg-[#E8F0F7] text-[#446783]',
  },
  {
    label: '利用中',
    value: '121',
    note: '全体の94.5%',
    icon: FiUserCheck,
    iconClassName: 'bg-[#E8F2E9] text-[#527158]',
  },
  {
    label: '管理者',
    value: '3',
    note: '変更なし',
    icon: FiShield,
    iconClassName: 'bg-[#F7EBDD] text-[#A35F31]',
  },
  {
    label: '確認が必要',
    value: '4',
    note: '承認待ち・停止中',
    icon: FiAlertCircle,
    iconClassName: 'bg-[#F6E7E5] text-[#A3544E]',
  },
];

const AdminSummaryCards = () => (
  <section aria-label="ユーザー状況" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
    {summaries.map(({ label, value, note, icon: Icon, iconClassName }) => (
      <article
        key={label}
        className="rounded-2xl border border-[#E7DED5] bg-white p-5 shadow-[0_12px_30px_rgba(73,52,38,0.05)]"
      >
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
      </article>
    ))}
  </section>
);

export default AdminSummaryCards;
