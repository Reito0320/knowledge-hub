import type { Prisma } from '@/lib/generated/prisma/client';
import type { PostVisibility } from '@/lib/post/post-visibility';

type PublishedPost = {
  id: string;
  authorId: string;
  authorDepartmentId: string | null;
  visibility: PostVisibility;
};

/**
 * 初回公開された記事を閲覧できる、お気に入り登録者へ通知を作る。
 * 複合一意制約とskipDuplicatesにより、再試行でも二重通知にならない。
 */
export const createNewPostNotifications = async (
  tx: Prisma.TransactionClient,
  post: PublishedPost,
) => {
  if (
    post.visibility === 'PRIVATE' ||
    (post.visibility === 'DEPARTMENT' && !post.authorDepartmentId)
  )
    return;

  const favorites = await tx.userFavorite.findMany({
    where: {
      favoriteUserId: post.authorId,
      follower: {
        status: 'ACTIVE',
        ...(post.visibility === 'DEPARTMENT'
          ? { departmentId: post.authorDepartmentId! }
          : {}),
      },
    },
    select: { followerId: true },
  });

  if (favorites.length === 0) return;

  await tx.notification.createMany({
    data: favorites.map(({ followerId }) => ({
      recipientId: followerId,
      postId: post.id,
    })),
    skipDuplicates: true,
  });
};
