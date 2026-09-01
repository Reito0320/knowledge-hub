import { getCurrentUser } from '@/lib/auth/get-current-user';
import {
  getProfileImageExtension,
  isProfileImageContentType,
  checkFileSize,
} from '@/lib/AWS/profile-image-upload';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  createProfileImageUploadUrl,
  createProfileImageViewUrl,
  deleteProfileImageObject,
  PROFILE_IMAGE_UPLOAD_URL_EXPIRES_IN,
} from '@/lib/AWS/s3-presigned-url';

/**
 * ファイル形式とサイズを検証し、S3へPUTするための署名付きURLを発行する。
 * @param req
 * @returns
 */
export const POST = async (req: NextRequest) => {
  try {
    const userId = await getCurrentUser();
    if (!userId)
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const { contentType, fileSize } = await req.json();

    const isMatchContentType = isProfileImageContentType(contentType);
    if (!isMatchContentType)
      return NextResponse.json(
        { message: 'JPEG・PNG・WebPの画像を選択してください。' },
        { status: 400 },
      );

    const isMatchFileSize = checkFileSize(fileSize);
    if (!isMatchFileSize)
      return NextResponse.json(
        { message: '画像は5MB以下にしてください。' },
        { status: 400 },
      );

    const extension = getProfileImageExtension(contentType);
    // userId配下へ限定し、推測しにくいUUIDで同名ファイルの上書きを防ぐ。
    const objectKey = `profile-images/${userId}/${crypto.randomUUID()}.${extension}`;

    const uploadUrl = await createProfileImageUploadUrl(
      objectKey,
      contentType,
      userId,
    );

    return NextResponse.json({
      uploadUrl,
      objectKey,
      expiresIn: PROFILE_IMAGE_UPLOAD_URL_EXPIRES_IN,
      message: 'S3アップロードURLの発行に成功しました。',
    });
  } catch (error) {
    console.error('S3アップロードURLの発行に失敗しました:', error);
    return NextResponse.json(
      { message: '画像アップロードの準備に失敗しました。' },
      { status: 500 },
    );
  }
};

/**
 * S3へのアップロード後、ログインユーザーのphotoObjectKeyを更新する。
 * @param req
 * @returns
 */
export const PATCH = async (req: NextRequest) => {
  try {
    const userId = await getCurrentUser();
    if (!userId)
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const body: unknown = await req.json();

    if (
      typeof body !== 'object' ||
      body === null ||
      !('objectKey' in body) ||
      typeof body.objectKey !== 'string'
    )
      return NextResponse.json(
        { message: 'objectKeyが送信されていません。' },
        { status: 400 },
      );

    const objectKey = body.objectKey;
    const expectedPrefix = `profile-images/${userId}/`;

    if (
      !objectKey.startsWith(expectedPrefix) ||
      !/\.(jpg|png|webp)$/.test(objectKey)
    )
      return NextResponse.json(
        { message: '画像の保存先が正しくありません。' },
        { status: 400 },
      );

    const prevUserData = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        photoObjectKey: true,
      },
    });

    const prevObjectKey = prevUserData?.photoObjectKey;

    // DBを更新する前に表示URLを作れることを確認する。
    const photoUrl = await createProfileImageViewUrl(objectKey);

    if (prevObjectKey !== objectKey) {
      await prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          photoObjectKey: objectKey,
        },
      });
    }

    if (prevObjectKey && prevObjectKey !== objectKey) {
      const deleted = await deleteProfileImageObject(prevObjectKey);

      if (!deleted) {
        // DBは新しい画像を参照済みなので、画像更新自体は成功として扱う。
        console.error('以前のプロフィール画像を削除できませんでした。');
      }
    }

    return NextResponse.json({
      message: 'プロフィール画像の保存先を更新しました。',
      photoUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'プロフィール画像の保存先を更新できませんでした。' },
      { status: 500 },
    );
  }
};

/**
 * DBに保存したphotoObjectKeyから、表示用の署名付きURLを発行する。
 * @returns
 */
export const GET = async () => {
  try {
    const userId = await getCurrentUser();
    if (!userId)
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        photoObjectKey: true,
      },
    });

    if (!user?.photoObjectKey)
      return NextResponse.json({
        message: 'プロフィール画像は登録されていません。',
        photoUrl: null,
      });

    const photoUrl = await createProfileImageViewUrl(user.photoObjectKey);
    return NextResponse.json({
      message: 's3の画像取得に成功しました。',
      photoUrl,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: 's3の画像取得に失敗しています。',
        photoUrl: null,
      },
      { status: 500 },
    );
  }
};
