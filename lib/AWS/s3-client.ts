import { S3Client } from '@aws-sdk/client-s3';
import 'server-only';

export const getS3BucketName = () => {
  const bucketName = process.env.S3_BUCKET_NAME;

  if (!bucketName)
    throw new Error(
      'S3_BUCKET_NAMEが設定されていません。環境変数を確認してください。',
    );

  return bucketName;
};

export const getS3Region = () => {
  const region = process.env.S3_REGION;

  if (!region)
    throw new Error(
      'S3_REGIONが設定されていません。環境変数を確認してください。',
    );

  return region;
};

let s3Client: S3Client | null = null;

/**
 * S3を使用する処理が実行された時だけClientを作成する。
 * これにより、S3を使わないAPIまで環境変数不足の影響で起動不能になるのを防ぐ。
 */
export const getS3Client = () => {
  if (s3Client) return s3Client;

  s3Client = new S3Client({
    region: getS3Region(),
  });

  return s3Client;
};
