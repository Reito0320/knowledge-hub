import {
  createPostImageUploadUrl,
  POST_IMAGE_UPLOAD_URL_EXPIRES_IN,
} from '@/lib/AWS/s3-presigned-url';
import {
  checkFileSize,
  getProfileImageExtension,
  isProfileImageContentType,
} from '@/lib/AWS/profile-image-upload';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import { NextRequest, NextResponse } from 'next/server';

/** 記事本文へ埋め込む画像のS3 PUT用署名URLを発行する。 */
export const POST = async (request: NextRequest) => {
  try {
    const userId = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();
    if (typeof body !== 'object' || body === null) {
      return NextResponse.json(
        { message: '画像の情報が正しくありません。' },
        { status: 400 },
      );
    }

    const contentType = 'contentType' in body ? body.contentType : undefined;
    const fileSize = 'fileSize' in body ? body.fileSize : undefined;
    if (!isProfileImageContentType(contentType)) {
      return NextResponse.json(
        { message: 'JPEG・PNG・WebPの画像を選択してください。' },
        { status: 400 },
      );
    }
    if (!checkFileSize(fileSize)) {
      return NextResponse.json(
        { message: '画像は5MB以下にしてください。' },
        { status: 400 },
      );
    }

    const extension = getProfileImageExtension(contentType);
    const fileName = `${crypto.randomUUID()}.${extension}`;
    const objectKey = `post-images/${userId}/${fileName}`;
    const uploadUrl = await createPostImageUploadUrl(
      objectKey,
      contentType,
      userId,
    );

    return NextResponse.json({
      uploadUrl,
      markdownUrl: `/api/post/images/${encodeURIComponent(userId)}/${fileName}`,
      expiresIn: POST_IMAGE_UPLOAD_URL_EXPIRES_IN,
    });
  } catch (error) {
    console.error('記事画像のアップロード準備に失敗しました:', error);
    return NextResponse.json(
      { message: '画像アップロードの準備に失敗しました。' },
      { status: 500 },
    );
  }
};
