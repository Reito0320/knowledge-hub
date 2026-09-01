import { verifyCognitoAccessToken } from '@/lib/AWS/cognito-verify-access-token';
import { createProfileImageViewUrl } from '@/lib/AWS/s3-presigned-url';
import { deleteCookie, getCookie } from '@/lib/cookie';
import { decrypt } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 自前sessionを取得して、それを元にpayloadからuserIdを取り出し、それを使ってuser情報を取得して返すGET api
 * @returns
 */
export const GET = async () => {
  try {
    const sessionToken = await getCookie('session');

    if (!sessionToken)
      return NextResponse.json(
        {
          message: 'session cookieがありません。',
        },
        { status: 401 },
      );

    const payload = await decrypt(sessionToken);

    if (!payload || typeof payload.userId !== 'string')
      return NextResponse.json(
        {
          message: 'sessionを確認できませんでした。',
        },
        { status: 401 },
      );

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        photoObjectKey: true,
        jobTitle: true,
        bio: true,
        role: true,
        department: { select: { id: true, name: true } },
      },
    });

    if (!user)
      return NextResponse.json(
        {
          message: 'userが存在していませんでした。',
        },
        { status: 401 },
      );

    let photoUrl: string | null = null;

    if (user.photoObjectKey) {
      try {
        photoUrl = await createProfileImageViewUrl(user.photoObjectKey);
      } catch (error) {
        // S3の一時障害でログイン状態まで失わせず、画像なしでユーザー情報を返す。
        console.error('プロフィール画像URLを発行できませんでした:', error);
      }
    }

    return NextResponse.json({
      message: 'sessionを確認しました。',
      user: {
        ...user,
        photoObjectKey: undefined,
        photoUrl,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: 'sessionの検証に失敗しました。',
      },
      { status: 401 },
    );
  }
};

/**
 * cognitoTokenが埋め込まれたheaderを取得して、tokenを抽出し検証。
 * 検証されたtokenからpayloadを発行して、payloadからsubを取得して、subからuserの情報を探す。
 * 見つかった場合は自前sessionの発行
 * @returns void
 */
export const POST = async (req: NextRequest) => {
  try {
    /* カスタムfetch経由で送られてきた通信かを確認 */
    const authorization = req.headers.get('authorization');
    /* カスタムfetchの通信の中にtokenが確認できなかった場合の分岐 */
    if (!authorization?.startsWith('Bearer '))
      return NextResponse.json(
        {
          message: '認証トークンがありませんでした。',
        },
        { status: 401 },
      );

    /* headerの中からtokenを切り出す */
    const accessToken = authorization.slice('Bearer '.length);
    /* tokenの検証をし、正常であればpayloadが発行される */
    const payload = await verifyCognitoAccessToken(accessToken);

    if (!payload.sub)
      return NextResponse.json(
        {
          message: 'cognito subの取得できません',
        },
        { status: 401 },
      );

    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
      },
    });

    if (!user)
      return NextResponse.json(
        {
          message: 'アプリのUserが作成されていません。',
        },
        { status: 403 },
      );

    await createSession(user.id);

    return NextResponse.json(
      {
        message: 'ログインしました。',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: '認証に失敗しました。' },
      { status: 401 },
    );
  }
};

export const DELETE = async () => {
  try {
    /* sessionを削除する通信 */
    await deleteCookie('session');
    return NextResponse.json(
      {
        message: 'sessionの削除を実施しました。',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: 'sessionの削除ができませんでした。',
      },
      { status: 401 },
    );
  }
};
