'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  FiArrowRight,
  FiBriefcase,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCode,
  FiHeart,
  FiMail,
  FiMessageCircle,
  FiTag,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';

import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';
import type { HomeMember, HomePost } from '@/lib/home/get-home-data';
import { getTagColorClass } from '@/lib/tag/get-tag-color-class';
import { fetchTogglePostLike } from '@/app/api/post/[postId]/fetch';

type SecondSectionProps = {
  popularArticles: HomePost[];
  trendingTags: Array<{ id: string; name: string; slug: string }>;
  categoryCounts: {
    TECH: number;
    BUSINESS: number;
  };
  featuredMembers: HomeMember[];
};

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  month: 'short',
  day: 'numeric',
});

const SecondSection = ({
  popularArticles,
  trendingTags,
  categoryCounts,
  featuredMembers,
}: SecondSectionProps) => {
  const [isMemberListOpen, setIsMemberListOpen] = useState(false);
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [updatingLikePostId, setUpdatingLikePostId] = useState<string | null>(
    null,
  );

  const handleToggleLike = async (postId: string) => {
    if (updatingLikePostId) return;

    try {
      setUpdatingLikePostId(postId);
      const result = await fetchTogglePostLike(postId);
      setLikeCounts((current) => ({
        ...current,
        [postId]: result.likeCount,
      }));
      setLikedPostIds((current) =>
        result.liked
          ? [...current.filter((id) => id !== postId), postId]
          : current.filter((id) => id !== postId),
      );
    } catch (error) {
      console.error('いいねの更新に失敗しました:', error);
    } finally {
      setUpdatingLikePostId(null);
    }
  };
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
            <div className="flex items-center gap-2 text-sm font-bold text-[#B55F24]">
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
                          className={`rounded-md px-2 py-1 text-[11px] font-medium ${getTagColorClass(tag.name)}`}
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-col gap-4 border-t border-[#EEF1F4] pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DCE9F7] text-xs font-bold text-[#254F8F]">
                          {article.author.photoUrl ? (
                            <Image
                              src={article.author.photoUrl}
                              alt={`${article.author.name}のプロフィール画像`}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          ) : (
                            article.author.name.trim().slice(0, 1) || 'U'
                          )}
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
                          onClick={() => handleToggleLike(article.id)}
                          disabled={updatingLikePostId === article.id}
                          aria-pressed={likedPostIds.includes(article.id)}
                          className={`flex items-center gap-1.5 transition hover:text-[#C15E67] disabled:opacity-50 ${likedPostIds.includes(article.id) ? 'text-[#C15E67]' : ''}`}
                          aria-label={`${article.title}にいいねする`}
                        >
                          <FiHeart
                            aria-hidden="true"
                            className={
                              likedPostIds.includes(article.id)
                                ? 'fill-current'
                                : ''
                            }
                          />
                          {likeCounts[article.id] ?? article._count.likes}
                        </button>
                        <Link
                          href={`/post/${article.id}#comments`}
                          className="flex items-center gap-1.5 transition hover:text-[#B26936]"
                        >
                          <FiMessageCircle aria-hidden="true" />
                          {article._count.comments}
                        </Link>
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
        <motion.section
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
          className="transform-gpu rounded-2xl border border-[#E0E6ED] bg-white p-5 will-change-[transform,opacity]"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F]">
            <FiTag aria-hidden="true" className="text-[#254F8F]" />
            注目のタグ
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {trendingTags.map((tag, index) => (
              <Link
                key={tag.id}
                href={`/search?tag=${encodeURIComponent(tag.slug)}`}
                className={`rounded-lg border px-2.5 py-2 text-xs font-medium transition ${
                  index % 3 === 0
                    ? 'border-[#EAD8C8] bg-[#FCF4EC] text-[#995D31] hover:border-[#C98A59]'
                    : index % 3 === 1
                      ? 'border-[#D5E5DC] bg-[#F1F8F4] text-[#39745A] hover:border-[#71A58A]'
                      : 'border-[#DCE3EC] bg-[#F5F8FC] text-[#526B89] hover:border-[#8BA2BE]'
                }`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        </motion.section>
        <motion.section
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
          className="transform-gpu overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#1E3A5F_0%,#334B62_64%,#8A5938_135%)] p-5 text-white will-change-[transform,opacity]"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <FiUsers aria-hidden="true" />
          </div>
          <h2 className="mt-4 text-lg font-bold">誰に聞けばいいか迷ったら</h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            キーワードや部署から、詳しいメンバーと過去の投稿を探せます。
          </p>
          <button
            type="button"
            onClick={() => setIsMemberListOpen((current) => !current)}
            aria-expanded={isMemberListOpen}
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:underline"
          >
            {isMemberListOpen ? 'メンバーを閉じる' : 'メンバーを探す'}
            {isMemberListOpen ? (
              <FiChevronUp aria-hidden="true" />
            ) : (
              <FiChevronDown aria-hidden="true" />
            )}
          </button>

          <AnimatePresence initial={false}>
            {isMemberListOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="overflow-hidden"
              >
                <div className="mt-4 space-y-2 border-t border-white/15 pt-4">
                  {featuredMembers.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.25,
                        delay: index * 0.04,
                        ease: 'easeOut',
                      }}
                    >
                      <Link
                        href={`/search?member=${encodeURIComponent(member.name)}&memberId=${encodeURIComponent(member.id)}`}
                        className="flex items-center gap-3 rounded-xl bg-white/8 p-2.5 transition hover:bg-white/14"
                      >
                        <span className="relative flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#EEDCCB] text-xs font-bold text-[#7E4C2B]">
                          {member.photoUrl ? (
                            <Image
                              src={member.photoUrl}
                              alt={`${member.name}のプロフィール画像`}
                              fill
                              sizes="36px"
                              className="object-cover"
                            />
                          ) : (
                            member.name.trim().slice(0, 1) || 'U'
                          )}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold text-white">
                            {member.name}
                          </span>
                          <span className="block truncate text-[11px] text-white/65">
                            {member.department?.name ??
                              member.jobTitle ??
                              member.email}
                          </span>
                        </span>
                        <span className="shrink-0 text-[10px] font-semibold text-white/55">
                          {member._count.posts}件
                        </span>
                      </Link>
                    </motion.div>
                  ))}
                  <Link
                    href="/search"
                    className="flex items-center justify-center gap-1 pt-2 text-xs font-bold text-[#F3D7C0] hover:text-white"
                  >
                    すべてのメンバーを見る
                    <FiArrowRight aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
        <motion.section
          initial={{ opacity: 0, x: 16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ type: 'tween', duration: 0.5, ease: 'easeInOut' }}
          className="transform-gpu rounded-2xl border border-[#E0E6ED] bg-white p-5 will-change-[transform,opacity]"
        >
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
        </motion.section>
      </aside>
    </main>
  );
};

export default SecondSection;
