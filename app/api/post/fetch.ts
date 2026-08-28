type PostData = {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags: Array<{ type: 'existing'; id: string } | { type: 'new'; name: string }>;
};

// GET /api/postが返す記事一覧専用の型。
// PrismaのPostモデル本体に加え、関連タグと件数を含む。
export type PostListItem = {
  id: string;
  title: string;
  excerpt: string | null;
  category: 'TECH' | 'BUSINESS';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
  postTags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    likes: number;
    comments: number;
  };
};

type GetPostDataResponse = {
  message: string;
  data: PostListItem[];
};

export const fetchPostCreate = async (data: PostData) => {
  const res = await fetch('/api/post', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('記事の保存の通信に失敗しています。');

  const { message } = await res.json();
  return message;
};

export const fetchGETPostData = async (): Promise<PostListItem[]> => {
  const res = await fetch('/api/post');
  if (!res.ok) throw new Error('記事全件取得の通信に失敗しています。');

  const { data }: GetPostDataResponse = await res.json();
  return data;
};
