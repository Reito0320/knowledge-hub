type PostData = {
  title?: string;
  excerpt?: string;
  content?: string;
  category?: string;
  tags: Array<{ type: 'existing'; id: string } | { type: 'new'; name: string }>;
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

export const fetchGETPostData = async () => {};
