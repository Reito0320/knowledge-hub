'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { FiSearch } from 'react-icons/fi';

type Props = {
  member: string;
  memberId: string;
  category: '' | 'TECH' | 'BUSINESS';
};

const MemberSearchControls = ({ member, memberId, category }: Props) => {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeCategory = (nextCategory: '' | 'TECH' | 'BUSINESS') => {
    const params = new URLSearchParams();
    if (member) params.set('member', member);
    if (memberId) params.set('memberId', memberId);
    if (nextCategory) params.set('category', nextCategory);
    startTransition(() => router.push(`/search?${params.toString()}`));
  };

  return (
    <section className="mt-6 rounded-2xl border border-[#E3D9CF] bg-[#FFFCF9] p-4 sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <form action="/search" className="w-full lg:max-w-2xl">
        <label htmlFor="member-search" className="mb-2 block text-sm font-bold text-[#514941]">メンバー名で検索</label>
        <div className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <FiSearch aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9A8B7E]" />
          <input id="member-search" name="member" type="search" defaultValue={member} placeholder="名前の一部を入力してください" className="h-11 w-full rounded-xl border border-[#DED4CA] bg-white pl-10 pr-4 text-sm text-[#4B4E54] outline-none transition placeholder:text-[#A69C93] focus:border-[#B97845]/60 focus:ring-3 focus:ring-[#B97845]/10" />
        </div>
        <button type="submit" className="h-11 shrink-0 rounded-xl bg-[#A66334] px-5 text-sm font-bold text-white transition hover:bg-[#86502D]">検索</button>
        </div>
      </form>

      <div>
      <p className="mb-2 text-sm font-bold text-[#514941]">記事カテゴリ</p>
      <nav aria-label="記事カテゴリ" className="flex w-fit flex-wrap gap-2 rounded-xl border border-[#E3D9CF] bg-white p-1.5">
        {[
          { value: '', label: 'すべて' },
          { value: 'TECH', label: '技術ブログ' },
          { value: 'BUSINESS', label: '業務・カルチャー' },
        ].map((item) => (
          <button key={item.value || 'ALL'} type="button" onClick={() => changeCategory(item.value as '' | 'TECH' | 'BUSINESS')} disabled={isPending} aria-pressed={category === item.value} className={`rounded-lg px-4 py-2 text-sm font-bold transition disabled:cursor-wait ${category === item.value ? 'bg-[#A66334] text-white shadow-sm' : 'text-[#70675F] hover:bg-[#FFF3E8] hover:text-[#99582E]'}`}>
            {item.label}
          </button>
        ))}
      </nav>
      </div>
      </div>

      {isPending && (
        <div className="mt-5 space-y-4" role="status" aria-label="メンバーの記事を読み込み中">
          {[0, 1].map((item) => (
            <div key={item} className="animate-pulse rounded-2xl border border-[#E6DDD4] bg-white p-6">
              <div className="flex items-center gap-3"><div className="size-11 rounded-full bg-[#EEE6DE]" /><div className="h-4 w-36 rounded bg-[#E9E0D8]" /></div>
              <div className="mt-6 h-5 w-2/3 rounded bg-[#EEE7E0]" />
              <div className="mt-3 h-4 w-full rounded bg-[#F3EDE7]" />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default MemberSearchControls;
