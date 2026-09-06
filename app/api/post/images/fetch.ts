import { readJsonResponse } from '@/lib/http/read-json-response';

export const uploadPostImage = async (file: File) => {
  const response = await fetch('/api/post/images', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contentType: file.type, fileSize: file.size }),
  });
  const data = await readJsonResponse<{
    message?: string;
    uploadUrl?: string;
    markdownUrl?: string;
  }>(response);

  if (!response.ok || !data.uploadUrl || !data.markdownUrl) {
    throw new Error(data.message ?? 'アップロードURLを取得できませんでした。');
  }

  const uploadResponse = await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadResponse.ok) throw new Error('S3へ画像を保存できませんでした。');

  return data.markdownUrl;
};
