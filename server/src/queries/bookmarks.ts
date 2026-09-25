import { prisma } from '@/server/src/infrastructure/prisma';
import { createOptionalProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';

export async function getBookmarksData(userId: string) {
  const viewer = await prisma.user.findUnique({ where: { id: userId }, select: { departmentId: true } });
  const [bookmarks, favoriteRecords] = await Promise.all([
    prisma.bookmark.findMany({
      where: { userId, post: { status: 'PUBLISHED', OR: [{ authorId: userId }, { visibility: 'ORGANIZATION' }, { visibility: 'LINK' }, ...(viewer?.departmentId ? [{ visibility: 'DEPARTMENT' as const, author: { departmentId: viewer.departmentId } }] : [])] } },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        post: {
          select: {
            id: true,
            title: true,
            excerpt: true,
            category: true,
            author: { select: { name: true, photoObjectKey: true } },
            postTags: {
              select: { tag: { select: { id: true, name: true } } },
            },
          },
        },
      },
    }),
    prisma.userFavorite.findMany({
      where: { followerId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        createdAt: true,
        favoriteUser: {
          select: {
            id: true,
            name: true,
            email: true,
            jobTitle: true,
            photoObjectKey: true,
            status: true,
            department: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const favoriteUsers = await Promise.all(
    favoriteRecords.map(async ({ favoriteUser, createdAt }) => ({
      ...favoriteUser,
      photoObjectKey: undefined,
      createdAt,
      photoUrl: await createOptionalProfileImageViewUrl(
        favoriteUser.photoObjectKey,
      ),
    })),
  );

  const serializedBookmarks = await Promise.all(
    bookmarks.map(async (bookmark) => ({
      ...bookmark,
      post: {
        ...bookmark.post,
        author: {
          name: bookmark.post.author.name,
          photoUrl: await createOptionalProfileImageViewUrl(
            bookmark.post.author.photoObjectKey,
          ),
        },
      },
    })),
  );

  return { favoriteUsers, bookmarks: serializedBookmarks };
}
