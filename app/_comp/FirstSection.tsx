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
import { toast } from 'react-toastify';

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
        toast.error('ナレッジ候補を取得できませんでした。', {
          toastId: 'knowledge-suggestion-error',
        });
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
    <section className="relative overflow-x-clip border-b border-[#E7DDD4] bg-[linear-gradient(135deg,#FFFCF8_0%,#F8F5F1_55%,#F2F6F5_100%)]">
      <div className="pointer-events-none absolute -left-24 top-10 size-72 rounded-full bg-[#F2D7BF]/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-0 size-80 rounded-full bg-[#DCE9E3]/35 blur-3xl" />
      <div className="relative mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-12 lg:py-18">
        <section className="grid min-w-0 w-full items-center gap-9 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] lg:gap-12 xl:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.95fr)] xl:gap-14">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={motionContainer.containerVariants}
            className="max-w-xl"
          >
            <motion.div
              variants={motionContainer.itemVariants}
              className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#E8CDB7] bg-white/75 px-3 py-1.5 text-xs font-bold text-[#9D5B2F] shadow-sm backdrop-blur"
            >
              <FiBookOpen aria-hidden="true" />
              Knowledge-Hub · 社内ナレッジ共有
            </motion.div>
            <motion.h1
              variants={motionContainer.itemVariants}
              className="text-[2rem] font-bold leading-[1.28] tracking-[-0.035em] text-[#414750] sm:text-[2.55rem] lg:text-[2.8rem]"
            >
              知りたいことに、
              <br />
              <span className="text-[#A66334]">すぐたどり着く。</span>
            </motion.h1>
            <motion.div variants={motionContainer.itemVariants}>
              <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-[#57534F] sm:text-base sm:leading-8">
                技術情報から日々の業務ノウハウまで、社内に散らばる経験を一か所へ。記事と、その分野に詳しいメンバーを一緒に見つけられます。
              </p>
            </motion.div>
          </motion.div>
          <div className="flex min-w-0 w-full flex-col gap-5 rounded-3xl border border-white/80 bg-white/70 p-5 shadow-[0_20px_55px_rgba(72,48,30,0.08)] backdrop-blur sm:p-6 lg:gap-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9D5B2F]">
                Today&apos;s knowledge
              </p>
              <h2 className="mt-1 text-lg font-bold text-[#4B4E54]">
                投稿された全ての記事
              </h2>
            </div>
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
                  className={`flex min-w-0 items-center gap-3 rounded-2xl border px-4 py-4 sm:flex-col sm:items-start lg:px-4 ${cardClass}`}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-xl ${iconClass}`}
                  >
                    <Icon aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xl font-bold text-[#454A52]">{value}</p>
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
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-[#D9C6B5] bg-white px-5 text-sm font-bold text-[#87512F] shadow-sm transition hover:border-[#B97845] hover:bg-[#FFF7EF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B97845]"
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
          className="relative mt-10 rounded-2xl border border-[#DED2C7] bg-white p-3 shadow-[0_14px_38px_rgba(82,57,38,0.08)] sm:flex sm:items-center sm:gap-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-3 px-2">
            <FiSearch
              aria-hidden="true"
              className="shrink-0 text-xl text-[#A66334]"
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
            className="mt-2 h-11 w-full rounded-xl bg-[#A66334] px-6 text-sm font-bold text-white transition hover:bg-[#86502D] sm:mt-0 sm:w-auto"
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
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#756C64]">
          <span className="mr-1 font-semibold">よく検索されています</span>
          {['入社手続き', 'AWS', '開発環境', '社内申請'].map((keyword) => (
            <button
              key={keyword}
              type="button"
              onClick={() => router.push('/search?category=' + keyword)}
              className="rounded-full border border-[#DED4CA] bg-white/80 px-3 py-1.5 transition hover:border-[#C88A5B] hover:bg-[#FFF8F1] hover:text-[#99582E]"
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
