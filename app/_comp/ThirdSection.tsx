'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';

const ThirdSection = () => {
  const [selectArticle, setSelectArticle] = useState<
    'all' | 'skill' | 'work'
  >();
  const router = useRouter();
  const latestArticles = [
    {
      category: '業務・カルチャー',
      title: 'プロジェクト開始時に合意しておくと助かる5つのこと',
      author: '高橋 美咲',
      department: 'PMO',
      initials: 'MT',
      tags: ['プロジェクト管理', 'チーム'],
      likes: 18,
      comments: 4,
      publishedAt: '3時間前',
    },
    {
      category: '技術ブログ',
      title: 'Prisma Migrationを本番環境へ安全に反映する流れ',
      author: '山本 翔',
      department: 'Web開発部',
      initials: 'SY',
      tags: ['Prisma', 'PostgreSQL'],
      likes: 24,
      comments: 7,
      publishedAt: '昨日',
    },
    {
      category: '業務・カルチャー',
      title: 'お客様からよく聞かれる質問と、回答時のポイント',
      author: '伊藤 彩',
      department: 'カスタマーサクセス部',
      initials: 'AI',
      tags: ['顧客対応', 'FAQ'],
      likes: 15,
      comments: 3,
      publishedAt: '昨日',
    },
  ];

  return (
    <section className="mt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#254F8F]">Latest</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1E3A5F]">
            新着ナレッジ
          </h2>
        </div>
        {/* TODO: useArticleFilterで「すべて・技術・業務」の選択状態を管理する */}
        <div className="flex w-fit rounded-xl border border-[#DDE4EC] bg-white p-1 text-xs font-semibold text-[#6B788A]">
          <button
            type="button"
            onClick={() => setSelectArticle('all')}
            className={`rounded-lg px-4 py-2  ${selectArticle === 'all' ? 'bg-[#254F8F] text-white' : 'bg-white text-black'}`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setSelectArticle('skill')}
            className={`rounded-lg px-4 py-2  ${selectArticle === 'skill' ? 'bg-[#254F8F] text-white' : 'bg-white text-black'}`}
          >
            技術
          </button>
          <button
            type="button"
            onClick={() => setSelectArticle('work')}
            className={`rounded-lg px-4 py-2  ${selectArticle === 'work' ? 'bg-[#254F8F] text-white' : 'bg-white text-black'}`}
          >
            業務
          </button>
        </div>
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-[#E0E6ED] bg-white">
        {latestArticles.map((article, index) => (
          <article
            key={article.title}
            /* ここに選択されたpostのidを入れてページ遷移 */
            onClick={() => router.push('#')}
            className={`cursor-pointer p-5 transition hover:bg-[#F8FAFC] sm:p-6 ${index !== latestArticles.length - 1 ? 'border-b border-[#E9EDF2]' : ''}`}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-[#254F8F]">
                    {article.category}
                  </span>
                  <span className="text-[#A0A9B5]">•</span>
                  <span className="text-[#8A97A8]">{article.publishedAt}</span>
                </div>
                <h3 className="mt-2 font-bold leading-6 text-[#26364A] hover:text-[#254F8F]">
                  <Link href="#">{article.title}</Link>
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7B8899]">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#EDF1F5] text-[10px] font-bold text-[#516176]">
                    {article.initials}
                  </span>
                  <span className="font-semibold text-[#566477]">
                    {article.author}
                  </span>
                  <span>{article.department}</span>
                  {article.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded bg-[#F1F4F7] px-1.5 py-1"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-xs font-semibold text-[#7B8899]">
                <span className="flex items-center gap-1.5">
                  <FiHeart aria-hidden="true" />
                  {article.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiMessageCircle aria-hidden="true" />
                  {article.comments}
                </span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default ThirdSection;
