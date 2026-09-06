import { describe, expect, it, vi } from 'vitest';
import type { Prisma } from '@/lib/generated/prisma/client';
import { createNewPostNotifications } from '@/lib/notification/create-new-post-notifications';

const createTransaction = () => {
  const findMany = vi.fn().mockResolvedValue([
    { followerId: 'follower-1' },
    { followerId: 'follower-2' },
  ]);
  const createMany = vi.fn().mockResolvedValue({ count: 2 });
  const tx = {
    userFavorite: { findMany },
    notification: { createMany },
  } as unknown as Prisma.TransactionClient;
  return { tx, findMany, createMany };
};

describe('createNewPostNotifications', () => {
  it('公開記事をお気に入り登録者へ一度ずつ通知する', async () => {
    const { tx, createMany } = createTransaction();

    await createNewPostNotifications(tx, {
      id: 'post-1',
      authorId: 'author-1',
      authorDepartmentId: 'department-1',
      visibility: 'ORGANIZATION',
    });

    expect(createMany).toHaveBeenCalledWith({
      data: [
        { recipientId: 'follower-1', postId: 'post-1' },
        { recipientId: 'follower-2', postId: 'post-1' },
      ],
      skipDuplicates: true,
    });
  });

  it('部署限定記事は同じ部署のフォロワーだけを検索する', async () => {
    const { tx, findMany } = createTransaction();

    await createNewPostNotifications(tx, {
      id: 'post-1',
      authorId: 'author-1',
      authorDepartmentId: 'department-1',
      visibility: 'DEPARTMENT',
    });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          follower: { status: 'ACTIVE', departmentId: 'department-1' },
        }),
      }),
    );
  });

  it('非公開記事では通知を作らない', async () => {
    const { tx, findMany, createMany } = createTransaction();

    await createNewPostNotifications(tx, {
      id: 'post-1',
      authorId: 'author-1',
      authorDepartmentId: 'department-1',
      visibility: 'PRIVATE',
    });

    expect(findMany).not.toHaveBeenCalled();
    expect(createMany).not.toHaveBeenCalled();
  });
});
