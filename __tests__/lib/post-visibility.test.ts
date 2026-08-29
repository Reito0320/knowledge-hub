import { describe, expect, it } from 'vitest';
import { canViewPost } from '@/lib/post/post-visibility';

const viewer = { id: 'viewer', departmentId: 'engineering' };
const post = {
  authorId: 'author',
  status: 'PUBLISHED' as const,
  visibility: 'DEPARTMENT' as const,
  author: { departmentId: 'engineering' },
};

describe('canViewPost', () => {
  it('同じ部署の公開記事は閲覧できる', () => {
    expect(canViewPost(post, viewer)).toBe(true);
  });

  it('違う部署からは閲覧できない', () => {
    expect(canViewPost(post, { ...viewer, departmentId: 'sales' })).toBe(false);
  });

  it('投稿者本人は非公開記事も閲覧できる', () => {
    expect(
      canViewPost(
        { ...post, status: 'DRAFT', visibility: 'PRIVATE' },
        { id: 'author', departmentId: null },
      ),
    ).toBe(true);
  });
});
