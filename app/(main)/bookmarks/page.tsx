import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { getTagColorClass } from '@/lib/tag/get-tag-color-class';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import { FiBookmark, FiClock, FiTag } from 'react-icons/fi';

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const BookmarksPage = async () => {
  // Cookieを読む認証ページなので、Build時ではなくRequest時に描画する。
  await connection();
  const userId = await getCurrentUser();
  if (!userId) redirect('/login');

  // Server Componentから直接取得し、初期表示時のクライアントAPI通信を省く。
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId, post: { status: 'PUBLISHED' } },
    orderBy: { createdAt: 'desc' },
    select: {
      createdAt: true,
      post: {
        select: {
          id: true,
          title: true,
          excerpt: true,
          category: true,
          author: { select: { name: true } },
          postTags: {
            select: { tag: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F7F6F3] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 text-sm font-bold text-[#B26936]">
          <FiBookmark aria-hidden="true" />
          Bookmarks
        </div>
        <h1 className="mt-1 text-3xl font-bold text-[#1E3A5F]">お気に入り</h1>
        <p className="mt-2 text-sm text-[#7B8899]">
          後から読み返したいナレッジをまとめています。
        </p>

        <section className="mt-7 space-y-4">
          {bookmarks.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#D8CFC6] bg-white px-6 py-16 text-center text-sm text-[#8A8178]">
              お気に入りに追加した記事はまだありません。
            </div>
          ) : (
            bookmarks.map(({ post, createdAt }) => (
              <article
                key={post.id}
                className="rounded-2xl border border-[#E3DDD6] bg-white p-5 transition hover:border-[#C98A59]/45 hover:shadow-sm sm:p-6"
              >
                <div className="flex items-center gap-2 text-xs text-[#8A8178]">
                  <span className="font-bold text-[#B26936]">
                    {post.category === 'TECH' ? '技術ブログ' : '業務・カルチャー'}
                  </span>
                  <FiClock aria-hidden="true" />
                  {dateFormatter.format(createdAt)}に追加
                </div>
                <h2 className="mt-3 text-lg font-bold text-[#1E3A5F] hover:text-[#B26936]">
                  <Link href={`/post/${post.id}`}>{post.title}</Link>
                </h2>
                {post.excerpt && (
                  <p className="mt-2 text-sm leading-6 text-[#66758A]">
                    {post.excerpt}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#7B8899]">
                    {post.author.name}
                  </span>
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
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
};

export default BookmarksPage;
