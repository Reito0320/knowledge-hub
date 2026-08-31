export const fetchProfileImageUploadUrl = async (file: File) => {
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
