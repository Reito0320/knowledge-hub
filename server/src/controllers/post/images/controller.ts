import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import {
  createPostImageUploadUrl,
  POST_IMAGE_UPLOAD_URL_EXPIRES_IN,
} from '@/server/src/infrastructure/aws/s3-presigned-url';
import {
  checkFileSize,
  getProfileImageExtension,
  isProfileImageContentType,
} from '@/lib/AWS/profile-image-upload';
import { getCurrentUser } from '@/server/src/auth/request-user';

/** 記事本文へ埋め込む画像のS3 PUT用署名URLを発行する。 */

@Controller('post/images')
export class PostImagesController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(request: Request) {
    try {
      const userId = await getCurrentUser();
      if (!userId) {
        return Response.json(
          { message: 'ログインが必要です。' },
          { status: 401 },
        );
      }

      const body: unknown = await request.json();
      if (typeof body !== 'object' || body === null) {
        return Response.json(
          { message: '画像の情報が正しくありません。' },
          { status: 400 },
        );
      }

      const contentType = 'contentType' in body ? body.contentType : undefined;
      const fileSize = 'fileSize' in body ? body.fileSize : undefined;
      if (!isProfileImageContentType(contentType)) {
        return Response.json(
          { message: 'JPEG・PNG・WebPの画像を選択してください。' },
          { status: 400 },
        );
      }
      if (!checkFileSize(fileSize)) {
        return Response.json(
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

      return Response.json({
        uploadUrl,
        markdownUrl: `/api/post/images/${encodeURIComponent(userId)}/${fileName}`,
        expiresIn: POST_IMAGE_UPLOAD_URL_EXPIRES_IN,
      });
    } catch (error) {
      console.error('記事画像のアップロード準備に失敗しました:', error);
      return Response.json(
        { message: '画像アップロードの準備に失敗しました。' },
        { status: 500 },
      );
    }

  }
}
