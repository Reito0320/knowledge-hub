import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import {
  getProfileImageExtension,
  isProfileImageContentType,
  MAX_PROFILE_IMAGE_SIZE,
} from '@/lib/AWS/profile-image-upload';
import { getS3BucketName, getS3Region, s3client } from '@/lib/AWS/s3-client';
import { NextRequest, NextResponse } from 'next/server';

const PRESIGNED_URL_EXPIRES_IN = 60;

/** ログインユーザー専用のプロフィール画像アップロードURLを発行する。 */
export const POST = async (req: NextRequest) => {
  try {
    const userId = await getCurrentUser();
    if (!userId)
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const { contentType, fileSize } = await req.json();

    if (!isProfileImageContentType(contentType))
      return NextResponse.json(
        { message: 'JPEG・PNG・WebPの画像を選択してください。' },
        { status: 400 },
      );

    if (
      typeof fileSize !== 'number' ||
      /* 整数かどうかの判定をしてくれる */
      !Number.isInteger(fileSize) ||
      fileSize <= 0 ||
      fileSize > MAX_PROFILE_IMAGE_SIZE
    )
      return NextResponse.json(
        { message: '画像は5MB以下にしてください。' },
        { status: 400 },
      );

    const bucketName = getS3BucketName();
    if (!bucketName || !getS3Region())
      return NextResponse.json(
        { message: 'S3の環境設定が不足しています。' },
        { status: 500 },
      );

    const extension = getProfileImageExtension(contentType);
    // userId配下へ限定し、推測しにくいUUIDで同名ファイルの上書きを防ぐ。
    const objectKey = `profile-images/${userId}/${crypto.randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: objectKey,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: { ownerId: userId },
    });
    const uploadUrl = await getSignedUrl(s3client, command, {
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
      signableHeaders: new Set(['content-type']),
    });

    return NextResponse.json({
      uploadUrl,
      objectKey,
      expiresIn: PRESIGNED_URL_EXPIRES_IN,
    });
  } catch (error) {
    console.error('S3アップロードURLの発行に失敗しました:', error);
    return NextResponse.json(
      { message: '画像アップロードの準備に失敗しました。' },
      { status: 500 },
    );
  }
};
