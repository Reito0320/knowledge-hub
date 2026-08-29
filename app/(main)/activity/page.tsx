import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import ActivityArticleList from './_components/ActivityArticleList';
import { connection } from 'next/server';

const ActivityPage = async () => {
  // Cookieを読む画面なので、ビルド時の静的生成ではなくリクエスト時に描画する。
  await connection();
  const userId = await getCurrentUser();
  if (!userId) redirect('/login');
  const viewer = await prisma.user.findUnique({
    where: { id: userId },
    select: { departmentId: true },
  });
  const visiblePostWhere = {
    status: 'PUBLISHED' as const,
    OR: [
      { authorId: userId },
      { visibility: 'ORGANIZATION' as const },
      { visibility: 'LINK' as const },
      ...(viewer?.departmentId
        ? [{ visibility: 'DEPARTMENT' as const, author: { departmentId: viewer.departmentId } }]
        : []),
    ],
  };

  const [comments, likes] = await Promise.all([
    prisma.comment.findMany({
      where: { authorId: userId, post: visiblePostWhere },
      orderBy: { createdAt: 'desc' },
      select: { content: true, createdAt: true, post: { select: { id: true, title: true, excerpt: true } } },
    }),
    prisma.postLike.findMany({
      where: { userId, post: visiblePostWhere },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, post: { select: { id: true, title: true, excerpt: true } } },
    }),
  ]);

  // 同じ記事へ複数回コメントしていても、一覧では最新の1件にまとめる。
  const commentedArticles = Array.from(
    new Map(comments.map((comment) => [comment.post.id, comment])).values(),
  ).map((comment) => ({
    postId: comment.post.id,
    title: comment.post.title,
    excerpt: comment.post.excerpt,
    occurredAt: comment.createdAt,
    note: `コメント: ${comment.content}`,
  }));

  const likedArticles = likes.map((like) => ({
    postId: like.post.id,
    title: like.post.title,
    excerpt: like.post.excerpt,
    occurredAt: like.createdAt,
  }));

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#FAF7F3] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A66334]">Your activity</p>
        <h1 className="mt-2 text-2xl font-bold text-[#454A52] sm:text-3xl">あなたのリアクション履歴</h1>
        <p className="mt-2 text-sm text-[#81766D]">過去にコメント・いいねした記事へ、ここから戻れます。</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ActivityArticleList title="コメントした記事" description="最新のコメント順" type="comment" articles={commentedArticles} />
          <ActivityArticleList title="いいねした記事" description="最近いいねした順" type="like" articles={likedArticles} />
        </div>
      </div>
    </main>
  );
};

export default ActivityPage;
