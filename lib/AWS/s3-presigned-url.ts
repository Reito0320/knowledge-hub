import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3BucketName, getS3Client } from './s3-client';
import 'server-only';

export const PROFILE_IMAGE_UPLOAD_URL_EXPIRES_IN = 60;
export const PROFILE_IMAGE_VIEW_URL_EXPIRES_IN = 60 * 60;
export const POST_IMAGE_UPLOAD_URL_EXPIRES_IN = 60;
export const POST_IMAGE_VIEW_URL_EXPIRES_IN = 5 * 60;

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

  return getSignedUrl(getS3Client(), command, {
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

  return getSignedUrl(getS3Client(), command, {
    expiresIn: PROFILE_IMAGE_VIEW_URL_EXPIRES_IN,
  });
};

/** 記事画像をS3へPUTするための署名付きURLを発行する。 */
export const createPostImageUploadUrl = async (
  objectKey: string,
  contentType: string,
  userId: string,
) => {
  const command = new PutObjectCommand({
    Bucket: getS3BucketName(),
    Key: objectKey,
    ContentType: contentType,
    Metadata: { ownerId: userId, usage: 'post-content' },
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: POST_IMAGE_UPLOAD_URL_EXPIRES_IN,
    signableHeaders: new Set(['content-type']),
  });
};

/** 認可済みの記事画像を表示する短時間の署名付きURLを発行する。 */
export const createPostImageViewUrl = async (objectKey: string) => {
  const command = new GetObjectCommand({
    Bucket: getS3BucketName(),
    Key: objectKey,
  });

  return getSignedUrl(getS3Client(), command, {
    expiresIn: POST_IMAGE_VIEW_URL_EXPIRES_IN,
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

/**
 * userのobjectKeyを使って対象のs3の画像を削除する。flagを返す関数
 * @param objectKey
 */
export const deleteProfileImageObject = async (objectKey: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: getS3BucketName(),
      Key: objectKey,
    });
    await getS3Client().send(command);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
