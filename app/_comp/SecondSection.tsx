'use client';

import Link from 'next/link';
import {
  FiArrowRight,
  FiBriefcase,
  FiClock,
  FiCode,
  FiHeart,
  FiMail,
  FiMessageCircle,
  FiTag,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';

import { motion } from 'motion/react';
import type { HomePost } from '@/lib/home/get-home-data';

type SecondSectionProps = {
  popularArticles: HomePost[];
  trendingTags: Array<{ id: string; name: string; slug: string }>;
  categoryCounts: {
    TECH: number;
    BUSINESS: number;
  };
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'short',
  day: 'numeric',
});

const SecondSection = ({
  popularArticles,
  trendingTags,
  categoryCounts,
}: SecondSectionProps) => {
  const motionContainer = {
    containerVariants: {
      hidden: {},
      visible: {
        transition: {
          staggerChildren: 0.08,
        },
      },
    },
    itemVariants: {
      hidden: {
        opacity: 0,
        y: 12,
      },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.4,
          ease: 'easeOut' as const,
        },
      },
    },
  };

  return (
    <main className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div>
        <motion.section
          initial="hidden"
          animate="visible"
          variants={motionContainer.containerVariants}
          className="flex items-end justify-between gap-4"
        >
          <motion.article
            initial="hidden"
            animate="visible"
            variants={motionContainer.itemVariants}
          >
            <div className="flex items-center gap-2 text-sm font-bold text-[#254F8F]">
              <FiTrendingUp aria-hidden="true" />
              Popular
            </div>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1E3A5F]">
              人気の記事
            </h2>
            <p className="mt-1 text-sm text-[#7B8899]">
              いいね・コメントの多いナレッジです
            </p>
          </motion.article>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={motionContainer.itemVariants}
          >
            <Link
              href="/search"
              className="hidden items-center gap-1 text-sm font-semibold text-[#254F8F] hover:underline sm:flex"
            >
              すべて見る
              <FiArrowRight aria-hidden="true" />
            </Link>
          </motion.div>
        </motion.section>

        <div className="mt-5 space-y-4">
          {popularArticles.map((article, index) => (
            <motion.article
              initial={{ opacity: 0, x: -16 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                type: 'tween',
                duration: 0.6,
                ease: 'easeInOut',
              }}
              key={article.id}
              className="transform-gpu will-change-[transform,opacity]"
            >
              <div className="group rounded-2xl border border-[#E0E6ED] bg-white p-5 transition-[border-color,box-shadow] duration-200 hover:border-[#254F8F]/25 hover:shadow-[0_14px_35px_rgba(30,58,95,0.08)] sm:p-6">
                <div className="flex gap-4">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F] text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${article.category === 'TECH' ? 'bg-[#E8F0FA] text-[#254F8F]' : 'bg-[#F8EADF] text-[#995D31]'}`}
                      >
                        {article.category === 'TECH'
                          ? '技術ブログ'
                          : '業務・カルチャー'}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-[#8A97A8]">
                        <FiClock aria-hidden="true" />
                        {article.publishedAt
                          ? dateFormatter.format(new Date(article.publishedAt))
                          : '公開日未設定'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-bold leading-7 text-[#1E3A5F] transition group-hover:text-[#254F8F]">
                      <Link href={`/post/${article.id}`}>{article.title}</Link>
                    </h3>
                    {article.excerpt && (
                      <p className="mt-2 text-sm leading-6 text-[#66758A]">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {article.postTags.map(({ tag }) => (
                        <span
                          key={tag.id}
                          className="rounded-md bg-[#F1F4F7] px-2 py-1 text-[11px] font-medium text-[#657287]"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-col gap-4 border-t border-[#EEF1F4] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        {/* TODO: user.photoUrl取得後にnext/imageのプロフィール画像へ置き換える */}
                        <div
                          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#DCE9F7] text-xs font-bold text-[#254F8F]"
                        >
                          {article.author.name.trim().slice(0, 1) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-2">
                            <p className="text-sm font-bold text-[#344256]">
                              {article.author.name}
                            </p>
                            <span className="text-xs text-[#7B8899]">
                              {article.author.department?.name ?? '部署未設定'}
                            </span>
                          </div>
                          <a
                            href={`mailto:${article.author.email}`}
                            className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#7B8899] hover:text-[#254F8F]"
                          >
                            <FiMail aria-hidden="true" />
                            {article.author.email}
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-semibold text-[#7B8899]">
                        {/* TODO: useToggleLikeでログインユーザーのいいね状態を更新する */}
                        <button
                          type="button"
                          className="flex items-center gap-1.5 transition hover:text-[#C15E67]"
                          aria-label={`${article.title}にいいねする`}
                        >
                          <FiHeart aria-hidden="true" />
                          {article._count.likes}
                        </button>
                        <span className="flex items-center gap-1.5">
                          <FiMessageCircle aria-hidden="true" />
                          {article._count.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-[#E0E6ED] bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F]">
            <FiTag aria-hidden="true" className="text-[#254F8F]" />
            注目のタグ
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {trendingTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/search?tag=${encodeURIComponent(tag.slug)}`}
                className="rounded-lg border border-[#E3E8EE] bg-[#F8FAFC] px-2.5 py-2 text-xs font-medium text-[#5F6D80] transition hover:border-[#254F8F]/30 hover:text-[#254F8F]"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </section>
        <section className="overflow-hidden rounded-2xl bg-[#1E3A5F] p-5 text-white">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <FiUsers aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold">誰に聞けばいいか迷ったら</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            キーワードや部署から、詳しいメンバーと過去の投稿を探せます。
          </p>
          <Link
            href="/search"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:underline"
          >
            メンバーを探す
            <FiArrowRight aria-hidden="true" />
          </Link>
        </section>
        <section className="rounded-2xl border border-[#E0E6ED] bg-white p-5">
          <h2 className="text-sm font-bold text-[#1E3A5F]">記事のカテゴリ</h2>
          <div className="mt-4 space-y-2">
            <Link
              href="/search?category=TECH"
              className="flex w-full items-center justify-between rounded-xl bg-[#EAF1FA] px-3 py-3 text-left text-sm font-semibold text-[#254F8F]"
            >
              <span className="flex items-center gap-2">
                <FiCode aria-hidden="true" />
                技術ブログ
              </span>
              <span className="text-xs">{categoryCounts.TECH}</span>
            </Link>
            <Link
              href="/search?category=BUSINESS"
              className="flex w-full items-center justify-between rounded-xl bg-[#FAF1E9] px-3 py-3 text-left text-sm font-semibold text-[#995D31]"
            >
              <span className="flex items-center gap-2">
                <FiBriefcase aria-hidden="true" />
                業務・カルチャー
              </span>
              <span className="text-xs">{categoryCounts.BUSINESS}</span>
            </Link>
          </div>
        </section>
      </aside>
    </main>
  );
};

export default SecondSection;
