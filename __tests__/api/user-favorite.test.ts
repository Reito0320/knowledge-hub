import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findFirstUser: vi.fn(),
  findUniqueFavorite: vi.fn(),
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findFirst: mocks.findFirstUser },
    userFavorite: {
      findUnique: mocks.findUniqueFavorite,
      create: mocks.createFavorite,
      delete: mocks.deleteFavorite,
    },
  },
}));

import { POST } from '@/app/api/users/[userId]/favorite/route';

const context = (userId = 'target-1') => ({
  params: Promise.resolve({ userId }),
});

describe('POST /api/users/[userId]/favorite', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue('follower-1');
    mocks.findFirstUser.mockResolvedValue({ id: 'target-1' });
    mocks.findUniqueFavorite.mockResolvedValue(null);
    mocks.createFavorite.mockResolvedValue({});
    mocks.deleteFavorite.mockResolvedValue({});
  });

  it('別ユーザーをお気に入りへ追加する', async () => {
    const response = await POST(new Request('http://localhost'), context());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.favorited).toBe(true);
    expect(mocks.createFavorite).toHaveBeenCalledWith({
      data: { followerId: 'follower-1', favoriteUserId: 'target-1' },
    });
  });

  it('登録済みユーザーはお気に入りから外す', async () => {
    mocks.findUniqueFavorite.mockResolvedValue({ followerId: 'follower-1' });

    const response = await POST(new Request('http://localhost'), context());
    const body = await response.json();

    expect(body.favorited).toBe(false);
    expect(mocks.deleteFavorite).toHaveBeenCalledWith({
      where: {
        followerId_favoriteUserId: {
          followerId: 'follower-1',
          favoriteUserId: 'target-1',
        },
      },
    });
  });

  it('自分自身はお気に入りへ追加できない', async () => {
    const response = await POST(
      new Request('http://localhost'),
      context('follower-1'),
    );

    expect(response.status).toBe(400);
    expect(mocks.createFavorite).not.toHaveBeenCalled();
  });
});
