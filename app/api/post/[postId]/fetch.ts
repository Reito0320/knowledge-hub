export type PostDetailData = {
  title: string;
  excerpt: string | null;
  content: string;
  category: 'TECH' | 'BUSINESS';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
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
