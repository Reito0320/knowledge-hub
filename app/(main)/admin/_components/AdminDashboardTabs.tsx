import Link from 'next/link';
import { FiBarChart2, FiUsers } from 'react-icons/fi';

const AdminDashboardTabs = ({ selected }: { selected: 'users' | 'analytics' }) => (
  <nav aria-label="ダッシュボード表示" className="mb-5 flex w-fit rounded-2xl border border-[#E2D9D0] bg-white p-1.5 shadow-sm">
    <Link href="/admin" aria-current={selected === 'users' ? 'page' : undefined} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${selected === 'users' ? 'bg-[#3F5268] text-white shadow-sm' : 'text-[#687482] hover:bg-[#F5F2EE]'}`}><FiUsers />ユーザー管理</Link>
    <Link href="/admin?tab=analytics" aria-current={selected === 'analytics' ? 'page' : undefined} className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${selected === 'analytics' ? 'bg-[#A66334] text-white shadow-sm' : 'text-[#687482] hover:bg-[#FFF5EC]'}`}><FiBarChart2 />アナリティクス</Link>
  </nav>
);

export default AdminDashboardTabs;
