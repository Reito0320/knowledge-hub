import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { FiSettings } from 'react-icons/fi';
import AdminSidebar from '../_components/AdminSidebar';
import DepartmentSettings from './_components/DepartmentSettings';

const AdminSettingsPage = async () => {
  await connection();
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/');
  const departments = await prisma.department.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, _count: { select: { members: true } } } });
  return <main className="min-h-[calc(100vh-4rem)] bg-[#FAF7F3] px-4 py-8 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><div className="mb-7"><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#A66334]"><FiSettings />Administration</p><h1 className="mt-2 text-3xl font-bold text-[#3F4854]">管理設定</h1><p className="mt-2 text-sm text-[#817970]">アプリ内で使用する管理マスタを設定します。</p></div><div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]"><AdminSidebar current="settings" /><DepartmentSettings departments={departments} /></div></div></main>;
};

export default AdminSettingsPage;
