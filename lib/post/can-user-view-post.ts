import 'server-only';
import { prisma } from '@/lib/prisma';
import { canViewPost } from './post-visibility';

/** いいね・コメント等の更新APIでも、詳細表示と同じ閲覧権限を再検証する。 */
export const canUserViewPost = async (postId: string, userId: string) => {
  const [post, viewer] = await Promise.all([
    prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        status: true,
        visibility: true,
        author: { select: { departmentId: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, departmentId: true },
    }),
  ]);
  return Boolean(post && viewer && canViewPost(post, viewer));
};
