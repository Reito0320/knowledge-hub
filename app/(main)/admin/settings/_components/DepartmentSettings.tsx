'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'react-toastify';

type Department = { id: string; name: string; _count: { members: number } };

const DepartmentSettings = ({ departments }: { departments: Department[] }) => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const request = async (url: string, method: 'POST' | 'PATCH' | 'DELETE', body?: object) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? '設定を変更できませんでした。');
      toast.success(data.message);
      setName('');
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '設定を変更できませんでした。');
    } finally { setIsSubmitting(false); }
  };

  return (
    <section className="overflow-hidden rounded-3xl border border-[#E7DED5] bg-white">
      <header className="border-b border-[#EEE7E0] p-5 sm:p-6"><h2 className="text-lg font-bold text-[#3F4854]">部署マスタ</h2><p className="mt-1 text-sm text-[#817970]">プロフィールで選択できる部署を管理します。</p><form className="mt-5 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (name.trim()) void request('/api/admin/departments', 'POST', { name }); }}><input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} placeholder="新しい部署名" className="h-11 min-w-0 flex-1 rounded-xl border border-[#DDD5CD] px-3 text-sm"/><button disabled={isSubmitting || !name.trim()} className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#A66334] px-4 text-sm font-bold text-white disabled:opacity-50"><FiPlus />追加</button></form></header>
      {departments.length === 0 ? <p className="p-8 text-center text-sm text-[#817970]">部署はまだありません。</p> : <ul className="divide-y divide-[#F0EAE4]">{departments.map((department) => <li key={department.id} className="flex items-center gap-3 px-5 py-4"><div className="min-w-0 flex-1"><p className="font-bold text-[#3F4854]">{department.name}</p><p className="mt-1 text-xs text-[#817970]">所属メンバー {department._count.members}名</p></div><button disabled={isSubmitting} onClick={() => { const nextName = window.prompt('新しい部署名を入力してください。', department.name); if (nextName?.trim() && nextName.trim() !== department.name) void request(`/api/admin/departments/${department.id}`, 'PATCH', { name: nextName }); }} className="flex size-9 items-center justify-center rounded-lg border border-[#DDD5CD] text-[#687482]" aria-label={`${department.name}の名称を変更`}><FiEdit2 /></button><button disabled={isSubmitting || department._count.members > 0} title={department._count.members > 0 ? '所属メンバーがいるため削除できません' : '部署を削除'} onClick={() => { if (window.confirm(`部署「${department.name}」を削除しますか？`)) void request(`/api/admin/departments/${department.id}`, 'DELETE'); }} className="flex size-9 items-center justify-center rounded-lg border border-[#E7D5D5] text-[#A3544E] disabled:cursor-not-allowed disabled:opacity-35" aria-label={`${department.name}を削除`}><FiTrash2 /></button></li>)}</ul>}
    </section>
  );
};

export default DepartmentSettings;
