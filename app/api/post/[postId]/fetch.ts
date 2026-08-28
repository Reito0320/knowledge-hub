export type PostDetailData = {
  title: string;
  excerpt: string | null;
  content: string;
  category: 'TECH' | 'BUSINESS';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
  canEdit: boolean;
  likedByCurrentUser: boolean;
  bookmarkedByCurrentUser: boolean;
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
  comments: PostComment[];
  postTags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
};

export type PostComment = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    photoUrl: string | null;
  };
};

type UpdatePostData = {
  title: string;
  excerpt?: string;
  content: string;
  category: 'TECH' | 'BUSINESS';
  tags: Array<
    | { type: 'existing'; id: string; name: string; slug: string }
    | { type: 'new'; name: string }
  >;
};

type GetTargetPostResponse = {
  message: string;
  targetPost: PostDetailData | null;
};

export const fetchGetTargetPost = async (
  postId: string,
): Promise<PostDetailData | null> => {
  const res = await fetch('/api/post/' + postId);
  if (!res.ok) throw new Error('一件検索の記事取得の通信に失敗しています。');

  const { targetPost }: GetTargetPostResponse = await res.json();
  return targetPost;
};

export const fetchUpdatePost = async (
  postId: string,
  data: UpdatePostData,
  options?: { publish?: boolean },
) => {
  const res = await fetch('/api/post/' + postId, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...data, publish: options?.publish ?? false }),
  });

  if (!res.ok) throw new Error('記事更新の通信に失敗しています。');

  const response: { message: string; postId: string } = await res.json();
  return response;
};

export const fetchTogglePostLike = async (postId: string) => {
  const response = await fetch(`/api/post/${postId}/like`, { method: 'POST' });
  if (!response.ok) throw new Error('いいねを更新できませんでした。');
  return response.json() as Promise<{ liked: boolean; likeCount: number }>;
};

export const fetchCreatePostComment = async (
  postId: string,
  content: string,
) => {
  const response = await fetch(`/api/post/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    const body = (await response.json()) as { message?: string };
    throw new Error(body.message ?? 'コメントを投稿できませんでした。');
  }
  return response.json() as Promise<{
    message: string;
    comment: PostComment;
  }>;
};

export const fetchToggleBookmark = async (postId: string) => {
  const response = await fetch(`/api/post/${postId}/bookmark`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('お気に入りを更新できませんでした。');
  return response.json() as Promise<{
    bookmarked: boolean;
    bookmarkCount: number;
  }>;
};

export const fetchDeletePost = async (postId: string) => {
  const response = await fetch(`/api/post/${postId}`, { method: 'DELETE' });
  if (!response.ok) throw new Error('記事を削除できませんでした。');
};
