export const requestProfileImageUpload = async (file: File) => {
  const res = await fetch('/api/users/profile/image-upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
  });
  /* この場で型を強制定義できる */
  const data = (await res.json()) as {
    message?: string;
    uploadUrl?: string;
    objectKey?: string;
    expiresIn?: number;
  };
  if (!res.ok || !data.uploadUrl || !data.objectKey)
    throw new Error(data.message ?? 'アップロードURLを取得できませんでした。');

  return {
    uploadUrl: data.uploadUrl,
    objectKey: data.objectKey,
    expiresIn: data.expiresIn ?? 60,
  };
};

/**
 * 署名付きURLへ画像をPUTする。ブラウザからS3へ直接送るためCORS設定が必要。
 * @param uploadURL
 * @param file
 * @returns
 */
export const uploadProfileImageToS3 = async (
  uploadUrl: string,
  file: File,
) => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!res.ok) throw new Error('s3へのuploadに失敗しています。');
  return;
};

/**
 * S3のobjectKeyをログインユーザーへ紐付け、表示用URLを受け取る。
 * @param objectKey
 * @returns
 */
export const saveProfileImageObjectKey = async (objectKey: string) => {
  const res = await fetch('/api/users/profile/image-upload', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ objectKey }),
  });
  const data = (await res.json()) as {
    message?: string;
    photoUrl?: string;
  };

  if (!res.ok || !data.photoUrl)
    throw new Error(
      data.message ?? 'プロフィール画像の保存に失敗しました。',
    );

  return data.photoUrl;
};

/**
 * 現在のプロフィール画像を表示するための署名付きURLを取得する。
 * @returns
 */
export const fetchCurrentProfileImageUrl = async () => {
  const res = await fetch('/api/users/profile/image-upload');
  if (!res.ok) throw new Error('userのinputした画像の取得失敗しています');
  const data = (await res.json()) as { photoUrl: string | null };
  return data.photoUrl;
};
