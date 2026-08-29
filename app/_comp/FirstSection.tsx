'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
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

type KnowledgeSuggestion = {
  id: string;
  title: string;
  category: 'TECH' | 'BUSINESS';
  author: { name: string };
};

const FirstSection = ({ stats }: FirstSectionProps) => {
  const router = useRouter();
  const [knowledgeSearch, setKnowledgeSearch] = useState<string>('');
  const [knowledgeSuggestions, setKnowledgeSuggestions] = useState<
    KnowledgeSuggestion[]
  >([]);
  const [isSearchingKnowledge, setIsSearchingKnowledge] = useState(false);

  useEffect(() => {
    const keyword = knowledgeSearch.trim();
    if (!keyword) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setIsSearchingKnowledge(true);
        const response = await fetch(
          `/api/posts/suggestions?q=${encodeURIComponent(keyword)}`,
          { signal: abortController.signal },
        );
        if (!response.ok) throw new Error('記事候補を取得できません。');

        const data = (await response.json()) as {
          posts: KnowledgeSuggestion[];
        };
        setKnowledgeSuggestions(data.posts);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
          return;
        console.error(error);
        setKnowledgeSuggestions([]);
      } finally {
        if (!abortController.signal.aborted) setIsSearchingKnowledge(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [knowledgeSearch]);

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
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-[#FFF0E3] px-3 py-1.5 text-xs font-semibold text-[#B55F24]"
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
                  cardClass: 'border-[#E2D5C8] bg-[#FCF7F2]',
                  iconClass: 'bg-[#F4E2D1] text-[#A45F2F]',
                },
                {
                  icon: FiUsers,
                  value: stats.postingMemberCount,
                  label: '投稿メンバー',
                  cardClass: 'border-[#D5E4DC] bg-[#F4F9F6]',
                  iconClass: 'bg-[#DDEEE5] text-[#39745A]',
                },
                {
                  icon: FiBriefcase,
                  value: stats.departmentCount,
                  label: '参加部署',
                  cardClass: 'border-[#D8DDED] bg-[#F5F6FB]',
                  iconClass: 'bg-[#E4E7F3] text-[#5D658E]',
                },
              ].map(({ icon: Icon, value, label, cardClass, iconClass }) => (
                <motion.div
                  variants={motionContainer.itemVariants}
                  key={label}
                  whileHover={{ y: -3 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-4 shadow-sm sm:flex-col sm:items-start lg:px-4 ${cardClass}`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl ${iconClass}`}
                  >
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

        <motion.div
          initial="hidden"
          animate="visible"
          variants={motionContainer.itemVariants}
          className="relative mt-9 rounded-2xl border border-[#E5DED5] bg-[#FCFAF7] p-3 shadow-[0_10px_30px_rgba(82,57,38,0.06)] sm:flex sm:items-center sm:gap-3"
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
              onChange={(e) => {
                const nextValue = e.target.value;
                setKnowledgeSearch(nextValue);
                if (!nextValue.trim()) {
                  setKnowledgeSuggestions([]);
                  setIsSearchingKnowledge(false);
                }
              }}
              value={knowledgeSearch}
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

          {knowledgeSearch.trim() && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 overflow-hidden rounded-xl border border-[#E3DCD4] bg-white shadow-[0_18px_42px_rgba(72,48,30,0.14)]">
              {isSearchingKnowledge ? (
                <p className="px-4 py-3 text-sm text-[#8A8178]">
                  ナレッジを検索中...
                </p>
              ) : knowledgeSuggestions.length > 0 ? (
                <ul aria-label="ナレッジの検索候補" className="p-2">
                  {knowledgeSuggestions.map((post) => (
                    <li key={post.id}>
                      <button
                        type="button"
                        onClick={() => router.push(`/post/${post.id}`)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left transition hover:bg-[#FCF5EE]"
                      >
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[10px] font-bold ${
                            post.category === 'TECH'
                              ? 'bg-[#E8F0FA] text-[#254F8F]'
                              : 'bg-[#F8EADF] text-[#995D31]'
                          }`}
                        >
                          {post.category === 'TECH' ? '技術' : '業務'}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[#344256]">
                            {post.title}
                          </span>
                          <span className="mt-0.5 block truncate text-xs text-[#8A8178]">
                            {post.author.name}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-sm text-[#8A8178]">
                  一致するナレッジはありません。
                </p>
              )}
            </div>
          )}
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
