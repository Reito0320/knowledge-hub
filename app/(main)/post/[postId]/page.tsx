'use client';

import {
  fetchGetTargetPost,
  type PostDetailData,
} from '@/app/api/post/[postId]/fetch';
import Skeleton from '@/comp/Skeleton';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import {
  FiArrowLeft,
  FiBookOpen,
  FiCalendar,
  FiClock,
  FiEdit3,
  FiEye,
  FiFileText,
  FiInfo,
} from 'react-icons/fi';

type PostDetailPageProps = {
  params: Promise<{
    postId: string;
  }>;
};

const statusStyles = {
  DRAFT: {
    label: '下書き',
    className: 'bg-[#EEF1F4] text-[#647286]',
  },
  PUBLISHED: {
    label: '公開中',
    className: 'bg-[#E5F3EB] text-[#39745A]',
  },
  ARCHIVED: {
    label: 'アーカイブ',
    className: 'bg-[#F7EDEA] text-[#9A5A4B]',
  },
} as const;

const categoryLabels = {
  TECH: '技術ブログ',
  BUSINESS: '業務・カルチャー',
} as const;

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

/* 記事を選んだ際に一枚を閲覧するページ */
const PostDetailPage = ({ params }: PostDetailPageProps) => {
  const { postId } = use(params);
  const [postData, setPostData] = useState<PostDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const getTargetPost = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const targetPost = await fetchGetTargetPost(postId);
        setPostData(targetPost);
      } catch (error) {
        console.error(error);
        setErrorMessage('記事を読み込めませんでした。');
      } finally {
        setIsLoading(false);
      }
    };

    void getTargetPost();
  }, [postId]);

  if (isLoading) return <Skeleton />;

  if (errorMessage || !postData)
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#F5F7FA] px-4 py-10">
        <section className="w-full max-w-lg rounded-2xl border border-[#DDE4EC] bg-white p-8 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-[#F7EDEA] text-[#9A5A4B]">
            <FiInfo aria-hidden="true" className="size-5" />
          </span>
          <h1 className="mt-4 text-lg font-bold text-[#1E3A5F]">
            記事を表示できません
          </h1>
          <p className="mt-2 text-sm text-[#7B8899]">
            {errorMessage ?? '対象の記事が見つかりませんでした。'}
          </p>
          <Link
            href="/post"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#254F8F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
          >
            <FiArrowLeft aria-hidden="true" />
            記事一覧へ戻る
          </Link>
        </section>
      </main>
    );

  const status = statusStyles[postData.status];

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] px-4 py-7 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/post"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#66758A] transition hover:text-[#254F8F]"
          >
            <FiArrowLeft aria-hidden="true" />
            自分の記事へ戻る
          </Link>
          <Link
            href={`/post/edit?postId=${postId}`}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#D8E0E9] bg-white px-4 text-sm font-bold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#EEF4FB] hover:text-[#254F8F]"
          >
            <FiEdit3 aria-hidden="true" />
            編集する
          </Link>
        </div>

        <article className="overflow-hidden rounded-2xl border border-[#DDE4EC] bg-white shadow-[0_14px_38px_rgba(30,58,95,0.06)]">
          <header className="border-b border-[#E8EDF2] px-5 py-7 sm:px-9 sm:py-10 lg:px-12">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
              >
                {status.label}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F0FA] px-2.5 py-1 text-[11px] font-bold text-[#254F8F]">
                <FiBookOpen aria-hidden="true" />
                {categoryLabels[postData.category]}
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-[#1E3A5F] sm:text-3xl lg:text-4xl">
              {postData.title.trim() || '無題の記事'}
            </h1>
            {postData.excerpt && (
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[#66758A] sm:text-base">
                {postData.excerpt}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-[#8491A2]">
              <span className="flex items-center gap-1.5">
                <FiClock aria-hidden="true" />
                {dateFormatter.format(new Date(postData.updatedAt))} 更新
              </span>
              {postData.publishedAt && (
                <span className="flex items-center gap-1.5">
                  <FiCalendar aria-hidden="true" />
                  {dateFormatter.format(new Date(postData.publishedAt))} 公開
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <FiEye aria-hidden="true" />
                {postData.viewCount} views
              </span>
            </div>
          </header>

          <div className="grid lg:grid-cols-[minmax(0,1fr)_220px]">
            <div className="min-w-0 px-5 py-8 sm:px-9 sm:py-10 lg:px-12">
              <div className="mb-7 flex items-center gap-2 border-b border-[#E8EDF2] pb-4 text-sm font-bold text-[#1E3A5F]">
                <FiFileText aria-hidden="true" className="text-[#254F8F]" />
                記事本文
              </div>

              {/* TODO: Markdownライブラリ導入後、contentをHTMLへ変換して表示する */}
              <div className="whitespace-pre-wrap wrap-break-words text-[15px] leading-8 text-[#344256] sm:text-base">
                {postData.content}
              </div>
            </div>

            <aside className="border-t border-[#E8EDF2] bg-[#FAFBFC] p-5 lg:border-l lg:border-t-0 lg:p-6">
              <div className="lg:sticky lg:top-24">
                <h2 className="text-sm font-bold text-[#1E3A5F]">記事情報</h2>
                <dl className="mt-4 space-y-4 text-xs">
                  <div>
                    <dt className="text-[#8A97A8]">ステータス</dt>
                    <dd className="mt-1 font-semibold text-[#4F5F73]">
                      {status.label}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#8A97A8]">カテゴリ</dt>
                    <dd className="mt-1 font-semibold text-[#4F5F73]">
                      {categoryLabels[postData.category]}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#8A97A8]">最終更新</dt>
                    <dd className="mt-1 font-semibold text-[#4F5F73]">
                      {dateFormatter.format(new Date(postData.updatedAt))}
                    </dd>
                  </div>
                </dl>

                <Link
                  href={`/post/edit?postId=${postId}`}
                  className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#254F8F] px-4 text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
                >
                  <FiEdit3 aria-hidden="true" />
                  この記事を編集
                </Link>
              </div>
            </aside>
          </div>
        </article>
      </div>
    </main>
  );
};

export default PostDetailPage;
