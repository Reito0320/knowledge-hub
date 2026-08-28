'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useState } from 'react';
import {
  FiBookOpen,
  FiBriefcase,
  FiEdit3,
  FiSearch,
  FiUsers,
} from 'react-icons/fi';
import { useRouter } from 'next/navigation';

type FirstSectionProps = {
  stats: {
    publishedPostCount: number;
    postingMemberCount: number;
    departmentCount: number;
  };
};

const FirstSection = ({ stats }: FirstSectionProps) => {
  const router = useRouter();
  const [knowledgeSearch, setKnowledgeSearch] = useState<string>('');

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

  const handleKnowledgeSearchButton = () => {
    if (!knowledgeSearch) return;
    const trimKeyWord = knowledgeSearch.trim();
    router.push('/search?q=' + encodeURIComponent(trimKeyWord));
  };

  return (
    <section className="border-b border-[#DDE4EC] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-5 sm:px-8 lg:py-16">
        <section className="grid w-full items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)] lg:gap-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={motionContainer.containerVariants}
            className="max-w-2xl"
          >
            <motion.div
              variants={motionContainer.itemVariants}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#254F8F]/8 px-3 py-1.5 text-xs font-semibold text-[#254F8F]"
            >
              <FiBookOpen aria-hidden="true" />
              社内の知識を、みんなの資産へ
            </motion.div>
            <motion.h1
              variants={motionContainer.itemVariants}
              className="text-3xl font-bold leading-tight tracking-[-0.03em] text-[#1E3A5F] sm:text-4xl lg:text-[2.5rem]"
            >
              困ったとき、知っている人と
              <br className="hidden sm:block" />
              情報にすぐたどり着ける。
            </motion.h1>
            <motion.div variants={motionContainer.itemVariants}>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#66758A] sm:text-base">
                技術情報から日々の業務ノウハウまで。
              </p>
              <p className="max-w-2xl text-sm leading-7 text-[#66758A] sm:text-base">
                キーワードで検索すると、関連記事と詳しいメンバーが見つかります。
              </p>
            </motion.div>
          </motion.div>
          <div className="flex w-full flex-col gap-5 lg:gap-6">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={motionContainer.containerVariants}
              className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:gap-3"
            >
              {[
                {
                  icon: FiBookOpen,
                  value: stats.publishedPostCount,
                  label: '公開ナレッジ',
                },
                {
                  icon: FiUsers,
                  value: stats.postingMemberCount,
                  label: '投稿メンバー',
                },
                {
                  icon: FiBriefcase,
                  value: stats.departmentCount,
                  label: '参加部署',
                },
              ].map(({ icon: Icon, value, label }) => (
                <motion.div
                  variants={motionContainer.itemVariants}
                  key={label}
                  className="flex min-w-0 items-center gap-3 rounded-2xl border border-[#E0E6ED] bg-[#F8FAFC] px-4 py-4 shadow-sm sm:flex-col sm:items-start lg:px-4"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#254F8F]/8 text-[#254F8F]">
                    <Icon aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-[#1E3A5F]">{value}</p>
                    <p className="whitespace-nowrap text-xs text-[#7B8899]">
                      {label}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={motionContainer.itemVariants}
            >
              <Link
                href="/post/new"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#254F8F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3A5F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254F8F]"
              >
                <FiEdit3 aria-hidden="true" />
                記事を書く
              </Link>
            </motion.div>
          </div>
        </section>

        {/* TODO: useKnowledgeSearchでキーワード・カテゴリ・タグを管理し、検索APIと接続する */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={motionContainer.itemVariants}
          className="mt-9 rounded-2xl border border-[#D8E1EB] bg-[#F8FAFC] p-3 shadow-[0_10px_30px_rgba(30,58,95,0.06)] sm:flex sm:items-center sm:gap-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
            <FiSearch
              aria-hidden="true"
              className="shrink-0 text-xl text-[#66758A]"
            />
            <label htmlFor="knowledge-search" className="sr-only">
              記事や詳しいメンバーを検索
            </label>
            <input
              id="knowledge-search"
              type="search"
              placeholder="例：Cognito認証、経費申請、障害対応..."
              onChange={(e) => setKnowledgeSearch(e.target.value)}
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-[#9AA7B7]"
            />
          </div>
          <button
            type="button"
            onClick={handleKnowledgeSearchButton}
            className="mt-2 h-11 w-full rounded-xl bg-[#1E3A5F] px-6 text-sm font-bold text-white transition hover:opacity-90 sm:mt-0 sm:w-auto"
          >
            ナレッジを検索
          </button>
        </motion.div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#66758A]">
          <span className="mr-1 font-semibold">よく検索されています</span>
          {['入社手続き', 'AWS', '開発環境', '社内申請'].map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => router.push('/search?category=' + keyword)}
              className="rounded-full border border-[#D8E1EB] bg-white px-3 py-1.5 transition hover:border-[#254F8F]/40 hover:text-[#254F8F]"
            >
              {keyword}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FirstSection;
