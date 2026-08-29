type PublishablePost = {
  title?: string;
  content?: string;
};

export type PublishValidationItem = {
  field: 'title' | 'content';
  label: string;
  valid: boolean;
  message: string;
};

/** 画面と保存処理で公開条件がずれないように、一か所で判定する。 */
export const validatePostForPublish = (
  post: PublishablePost,
): PublishValidationItem[] => [
  {
    field: 'title',
    label: 'タイトル',
    valid: Boolean(post.title?.trim()),
    message: '記事のタイトルを入力してください。',
  },
  {
    field: 'content',
    label: '本文',
    valid: Boolean(post.content?.trim()),
    message: '記事の本文を入力してください。',
  },
];
