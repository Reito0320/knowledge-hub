import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3BucketName, s3Client } from './s3-client';
import 'server-only';

export const PROFILE_IMAGE_UPLOAD_URL_EXPIRES_IN = 60;
export const PROFILE_IMAGE_VIEW_URL_EXPIRES_IN = 60 * 60;

/** プロフィール画像をS3へPUTするための署名付きURLを発行する。 */
export const createProfileImageUploadUrl = async (
  objectKey: string,
  contentType: string,
  userId: string,
) => {
  const command = new PutObjectCommand({
    Bucket: getS3BucketName(),
    Key: objectKey,
    ContentType: contentType,
    Metadata: { ownerId: userId },
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: PROFILE_IMAGE_UPLOAD_URL_EXPIRES_IN,
    signableHeaders: new Set(['content-type']),
  });
};

/** S3上のプロフィール画像を表示するための署名付きURLを発行する。 */
export const createProfileImageViewUrl = async (objectKey: string) => {
  const command = new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: objectKey,
  });

  return getSignedUrl(s3Client, command, {
    expiresIn: PROFILE_IMAGE_VIEW_URL_EXPIRES_IN,
  });
};

/**
 * DBに画像キーがある場合だけ、画面表示用の署名付きURLへ変換する。
 * S3の一時的な署名失敗でページ全体を表示できなくしないため、失敗時はnullを返す。
 */
export const createOptionalProfileImageViewUrl = async (
  objectKey: string | null,
) => {
  if (!objectKey) return null;

  try {
    return await createProfileImageViewUrl(objectKey);
  } catch (error) {
    console.error('プロフィール画像の表示URLを発行できませんでした。', error);
    return null;
  }
};
