import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUniqueUser: vi.fn(),
  findManyPosts: vi.fn(),
  createViewUrl: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock('@/lib/AWS/s3-presigned-url', () => ({
  createPostImageViewUrl: mocks.createViewUrl,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mocks.findUniqueUser },
    post: { findMany: mocks.findManyPosts },
  },
}));

import { GET } from '@/app/api/post/images/[ownerId]/[fileName]/route';

const fileName = '550e8400-e29b-41d4-a716-446655440000.png';
const context = (ownerId: string) => ({
  params: Promise.resolve({ ownerId, fileName }),
});

describe('GET /api/post/images/[ownerId]/[fileName]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue('viewer-1');
    mocks.findUniqueUser.mockResolvedValue({
      id: 'viewer-1',
      departmentId: 'department-1',
    });
    mocks.createViewUrl.mockResolvedValue(
      'https://bucket.example.com/post-image.png',
    );
  });

  it('画像の所有者は下書き保存前でも表示できる', async () => {
    const response = await GET(new Request('http://localhost'), context('viewer-1'));

    expect(response.status).toBe(307);
    expect(mocks.findManyPosts).not.toHaveBeenCalled();
    expect(mocks.createViewUrl).toHaveBeenCalledWith(
      `post-images/viewer-1/${fileName}`,
    );
  });

  it('閲覧可能な記事で使われている画像は別ユーザーにも表示する', async () => {
    mocks.findManyPosts.mockResolvedValue([
      {
        authorId: 'author-1',
        status: 'PUBLISHED',
        visibility: 'ORGANIZATION',
        author: { departmentId: 'department-2' },
      },
    ]);

    const response = await GET(new Request('http://localhost'), context('author-1'));

    expect(response.status).toBe(307);
  });

  it('非公開記事の画像は別ユーザーへ返さない', async () => {
    mocks.findManyPosts.mockResolvedValue([
      {
        authorId: 'author-1',
        status: 'PUBLISHED',
        visibility: 'PRIVATE',
        author: { departmentId: 'department-2' },
      },
    ]);

    const response = await GET(new Request('http://localhost'), context('author-1'));

    expect(response.status).toBe(403);
    expect(mocks.createViewUrl).not.toHaveBeenCalled();
  });
});
