'use client';
import { fetchGETPostData, type PostListItem } from '@/app/api/post/fetch';
import { fetchDeletePost } from '@/app/api/post/[postId]/fetch';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  FiBookOpen,
  FiClock,
  FiEdit3,
  FiEye,
  FiHeart,
  FiMessageCircle,
  FiPlus,
  FiTag,
  FiTrash2,
  FiGlobe,
  FiLink,
  FiUsers,
  FiLock,
} from 'react-icons/fi';
import { getTagColorClass } from '@/lib/tag/get-tag-color-class';
import { postStatusCounter } from './post';
import { useRouter } from 'next/navigation';
import Skeleton from '@/comp/Skeleton';

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

const visibilityStyles = {
  ORGANIZATION: { label: '社内全員', icon: FiGlobe, className: 'bg-[#E8F1EC] text-[#39745A]' },
  LINK: { label: 'リンク限定', icon: FiLink, className: 'bg-[#FFF1E4] text-[#9A5D2E]' },
  DEPARTMENT: { label: '同じ部署', icon: FiUsers, className: 'bg-[#EEEAF7] text-[#66508D]' },
  PRIVATE: { label: '自分のみ', icon: FiLock, className: 'bg-[#F2EEEE] text-[#735F62]' },
} as const;

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

// ログインユーザーが投稿した記事だけを表示する管理ページ。
const PostPage = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  useEffect(() => {
    const getPostList = async () => {
      try {
        setIsLoading(true);
        const data = await fetchGETPostData();
        setPosts(data);
      } catch (error) {
        console.error(error);
        setErrorMessage('読み込みに失敗しました。');
      } finally {
        setIsLoading(false);
      }
    };
    void getPostList();
  }, []);

  const { publishedCount, draftCount, totalLikes } = postStatusCounter(posts);

  const handleDeletePost = async (postId: string, title: string) => {
    if (!window.confirm(`「${title || '無題の記事'}」を削除しますか？`)) return;

    try {
      await fetchDeletePost(postId);
      setPosts((current) => current.filter((post) => post.id !== postId));
    } catch (error) {
      console.error(error);
      setErrorMessage('記事を削除できませんでした。');
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F7F6F3] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#B26936]">
              <FiBookOpen aria-hidden="true" />
              My Knowledge
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#1E3A5F] sm:text-3xl">
              自分の記事
            </h1>
            <p className="mt-2 text-sm text-[#7B8899]">
              投稿したナレッジと下書きをまとめて管理できます。
            </p>
          </div>
          <Link
            href="/post/new"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#254F8F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3A5F]"
          >
            <FiPlus aria-hidden="true" />
            新しい記事を書く
          </Link>
        </header>

        <section className="mt-7 grid grid-cols-3 gap-3 sm:max-w-xl sm:gap-4">
          {[
            { label: 'すべて', value: posts.length },
            { label: '公開中', value: publishedCount },
            { label: '下書き', value: draftCount },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-[#DDE4EC] bg-white px-4 py-4 sm:px-5"
            >
              <p className="text-xs font-semibold text-[#7B8899]">
                {item.label}
              </p>
              <p className="mt-1 text-2xl font-bold text-[#1E3A5F]">
                {item.value}
              </p>
            </div>
          ))}
        </section>

        {isLoading ? (
          <Skeleton />
        ) : posts.length === 0 ? (
          <section className="mt-7 flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E0] bg-white px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#E8F0FA] text-[#254F8F]">
              <FiEdit3 aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-5 text-lg font-bold text-[#1E3A5F]">
              まだ記事がありません
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-[#7B8899]">
              日々の業務で得た知識や、誰かに共有したい解決方法を最初の記事にしてみましょう。
            </p>
            <Link
              href="/post/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#254F8F] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
            >
              <FiPlus aria-hidden="true" />
              記事を書く
            </Link>
          </section>
        ) : errorMessage ? (
          <div>{errorMessage}</div>
        ) : (
          <section className="mt-7 space-y-4" aria-label="投稿した記事">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1E3A5F]">記事一覧</h2>
              <p className="text-xs text-[#8A97A8]">
                合計いいね {totalLikes}件
              </p>
            </div>

            {posts.map((post) => {
              const status = statusStyles[post.status];
              const visibility = visibilityStyles[post.visibility];
              const VisibilityIcon = visibility.icon;

              return (
                <article
                  key={post.id}
                  onClick={() => router.push('/post/' + post.id)}
                  className="cursor-pointer group rounded-2xl border border-[#E3DDD6] bg-white p-5 transition hover:border-[#C98A59]/45 hover:shadow-[0_12px_30px_rgba(72,48,30,0.07)] sm:p-6"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${status.className}`}
                        >
                          {status.label}
                        </span>
                        <span className="text-xs font-semibold text-[#6C7A8C]">
                          {categoryLabels[post.category]}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${visibility.className}`}>
                          <VisibilityIcon aria-hidden="true" />
                          {visibility.label}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#98A4B3]">
                          <FiClock aria-hidden="true" />
                          {dateFormatter.format(new Date(post.updatedAt))} 更新
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold leading-7 text-[#1E3A5F] group-hover:text-[#254F8F]">
                        <Link href={`/post/${post.id}`}>
                          {post.title.trim() || '無題の記事'}
                        </Link>
                      </h3>
                      {post.excerpt && (
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66758A]">
                          {post.excerpt}
                        </p>
                      )}

                      {post.postTags.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {post.postTags.map(({ tag }) => (
                            <span
                              key={tag.id}
                              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${getTagColorClass(tag.name)}`}
                            >
                              <FiTag aria-hidden="true" />
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <Link
                        href={`/post/${post.id}/edit`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#DDE4EC] px-4 text-sm font-bold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#EEF4FB] hover:text-[#254F8F]"
                      >
                        <FiEdit3 aria-hidden="true" />
                        編集する
                      </Link>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void handleDeletePost(post.id, post.title);
                        }}
                        aria-label={`${post.title}を削除`}
                        className="flex size-10 items-center justify-center rounded-lg border border-[#E7D5D5] text-[#A34F55] transition hover:bg-[#FBEFEF]"
                      >
                        <FiTrash2 aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-5 border-t border-[#EEF1F4] pt-4 text-xs font-semibold text-[#7B8899]">
                    <span className="flex items-center gap-1.5">
                      <FiEye aria-hidden="true" />
                      {post.viewCount}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiHeart aria-hidden="true" />
                      {post._count.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiMessageCircle aria-hidden="true" />
                      {post._count.comments}
                    </span>
                    {post.publishedAt && (
                      <span className="ml-auto">
                        {dateFormatter.format(new Date(post.publishedAt))} 公開
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
};

export default PostPage;
