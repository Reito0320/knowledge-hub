import { prisma } from '@/server/src/infrastructure/prisma';
import { createOptionalProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';

export async function getActivityData(userId: string) {
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
      select: { content: true, createdAt: true, post: { select: { id: true, title: true, excerpt: true, author: { select: { name: true, photoObjectKey: true } } } } },
    }),
    prisma.postLike.findMany({
      where: { userId, post: visiblePostWhere },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true, post: { select: { id: true, title: true, excerpt: true, author: { select: { name: true, photoObjectKey: true } } } } },
    }),
  ]);

  // 同じ記事へ複数回コメントしていても、一覧では最新の1件にまとめる。
  const seen = new Set<string>();
  const commentedRecords = comments.filter((comment) => {
    if (seen.has(comment.post.id)) return false;
    seen.add(comment.post.id);
    return true;
  });

  const [commentedArticles, likedArticles] = await Promise.all([
    Promise.all(commentedRecords.map(async (comment) => ({
      postId: comment.post.id,
      title: comment.post.title,
      excerpt: comment.post.excerpt,
      occurredAt: comment.createdAt,
      note: `コメント: ${comment.content}`,
      author: {
        name: comment.post.author.name,
        photoUrl: await createOptionalProfileImageViewUrl(comment.post.author.photoObjectKey),
      },
    }))),
    Promise.all(likes.map(async (like) => ({
      postId: like.post.id,
      title: like.post.title,
      excerpt: like.post.excerpt,
      occurredAt: like.createdAt,
      author: {
        name: like.post.author.name,
        photoUrl: await createOptionalProfileImageViewUrl(like.post.author.photoObjectKey),
      },
    }))),
  ]);

  return { commentedArticles, likedArticles };
}
