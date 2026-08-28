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
  postTags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string;
    };
  }>;
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
) => {
  const res = await fetch('/api/post/' + postId, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('記事更新の通信に失敗しています。');

  const { message }: { message: string } = await res.json();
  return message;
};
