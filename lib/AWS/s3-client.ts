import { S3Client } from '@aws-sdk/client-s3';
import 'server-only';

export const getS3BucketName = () => {
  const s3BucketName = process.env.S3_BUCKET_NAME;
  if (!s3BucketName)
    throw new Error(
      's3BucketNameの設定がされていません。環境変数を確認してみてください。',
    );
  return s3BucketName;
};
export const getS3Region = () => {
  const region = process.env.S3_REGION;
  if (!region)
    throw new Error(
      's3Regionが設定されていません。環境変数を確認してみてください。',
    );
  return region;
};

export const s3client = new S3Client({ region: getS3Region() });
