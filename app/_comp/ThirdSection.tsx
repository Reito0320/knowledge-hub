'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import { FiHeart, FiMessageCircle } from 'react-icons/fi';
import type { HomePost } from '@/lib/home/get-home-data';
import { getTagColorClass } from '@/lib/tag/get-tag-color-class';

type ThirdSectionProps = {
  latestArticles: HomePost[];
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'short',
  day: 'numeric',
});

const ThirdSection = ({ latestArticles }: ThirdSectionProps) => {
  const [selectArticle, setSelectArticle] = useState<'all' | 'skill' | 'work'>(
    'all',
  );
  const filteredArticles = latestArticles.filter((article) => {
    if (selectArticle === 'skill') return article.category === 'TECH';
    if (selectArticle === 'work') return article.category === 'BUSINESS';
    return true;
  });

  return (
    <section className="mt-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[#254F8F]">Latest</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1E3A5F]">
            新着ナレッジ
          </h2>
        </div>
        <div className="flex w-fit rounded-xl border border-[#DDE4EC] bg-white p-1 text-xs font-semibold text-[#6B788A]">
          <button
            type="button"
            onClick={() => setSelectArticle('all')}
            className={`rounded-lg px-4 py-2 transition ${selectArticle === 'all' ? 'bg-[#254F8F] text-white' : 'bg-white text-[#66758A] hover:bg-[#F3F6F9]'}`}
          >
            すべて
          </button>
          <button
            type="button"
            onClick={() => setSelectArticle('skill')}
            className={`rounded-lg px-4 py-2 transition ${selectArticle === 'skill' ? 'bg-[#254F8F] text-white' : 'bg-white text-[#66758A] hover:bg-[#F3F6F9]'}`}
          >
            技術
          </button>
          <button
            type="button"
            onClick={() => setSelectArticle('work')}
            className={`rounded-lg px-4 py-2 transition ${selectArticle === 'work' ? 'bg-[#A45F2F] text-white' : 'bg-white text-[#66758A] hover:bg-[#FCF4EC]'}`}
          >
            業務
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={selectArticle}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="mt-5 overflow-hidden rounded-2xl border border-[#E0E6ED] bg-white"
        >
          {filteredArticles.map((article, index) => (
            <motion.article
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.3,
                delay: Math.min(index * 0.04, 0.2),
                ease: 'easeOut',
              }}
              key={article.id}
              className={`p-5 transition-colors hover:bg-[#FCFAF7] sm:p-6 ${index !== filteredArticles.length - 1 ? 'border-b border-[#E9EDF2]' : ''}`}
            >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-[#254F8F]">
                    {article.category === 'TECH'
                      ? '技術ブログ'
                      : '業務・カルチャー'}
                  </span>
                  <span className="text-[#A0A9B5]">•</span>
                  <span className="text-[#8A97A8]">
                    {article.publishedAt
                      ? dateFormatter.format(new Date(article.publishedAt))
                      : '公開日未設定'}
                  </span>
                </div>
                <h3 className="mt-2 font-bold leading-6 text-[#26364A] hover:text-[#254F8F]">
                  <Link href={`/post/${article.id}`}>{article.title}</Link>
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7B8899]">
                  <span className="flex size-7 items-center justify-center rounded-full bg-[#EDF1F5] text-[10px] font-bold text-[#516176]">
                    {article.author.name.trim().slice(0, 1) || 'U'}
                  </span>
                  <span className="font-semibold text-[#566477]">
                    {article.author.name}
                  </span>
                  {article.author.department && (
                    <span>{article.author.department.name}</span>
                  )}
                  {article.postTags.map(({ tag }) => (
                    <span
                      key={tag.id}
                      className={`rounded px-1.5 py-1 ${getTagColorClass(tag.name)}`}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4 text-xs font-semibold text-[#7B8899]">
                <span className="flex items-center gap-1.5">
                  <FiHeart aria-hidden="true" />
                  {article._count.likes}
                </span>
                <span className="flex items-center gap-1.5">
                  <FiMessageCircle aria-hidden="true" />
                  {article._count.comments}
                </span>
              </div>
            </div>
            </motion.article>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default ThirdSection;
