import { S3Client } from '@aws-sdk/client-s3';

export const s3client = new S3Client({
  /* s3のマネコンのプロパティからリージョンの値をコピペ  */
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
});
