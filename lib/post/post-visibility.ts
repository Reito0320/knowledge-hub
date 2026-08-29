export const postVisibilities = [
  'ORGANIZATION',
  'LINK',
  'DEPARTMENT',
  'PRIVATE',
] as const;

export type PostVisibility = (typeof postVisibilities)[number];

export const isPostVisibility = (value: unknown): value is PostVisibility =>
  typeof value === 'string' &&
  postVisibilities.some((visibility) => visibility === value);

type ViewablePost = {
  authorId: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  visibility: PostVisibility;
  author: { departmentId: string | null };
};

type Viewer = { id: string; departmentId: string | null };

/**
 * 記事詳細APIで使う最終的な認可判定。
 * Proxyはログイン有無だけを見るため、記事単位の権限は必ずここで再確認する。
 */
export const canViewPost = (post: ViewablePost, viewer: Viewer) => {
  if (post.authorId === viewer.id) return true;
  if (post.status !== 'PUBLISHED') return false;

  switch (post.visibility) {
    case 'ORGANIZATION':
    case 'LINK':
      return true;
    case 'DEPARTMENT':
      return Boolean(
        viewer.departmentId &&
          post.author.departmentId === viewer.departmentId,
      );
    case 'PRIVATE':
      return false;
  }
};
