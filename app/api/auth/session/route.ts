import { verifyCognitoAccessToken } from '@/lib/amplify/cognito-verify-access-token';
import { getCognitoUser } from '@/lib/amplify/get-cognito-user';
import { deleteCookie, getCookie } from '@/lib/cookie';
import { decrypt } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async () => {
  try {
    const sessionToken = await getCookie('session');

    if (!sessionToken)
      return NextResponse.json(
        { message: 'session cookieがありません。' },
        { status: 401 },
      );

    const payload = await decrypt(sessionToken);

    if (!payload || typeof payload.userId !== 'string')
      return NextResponse.json(
        { message: 'sessionを確認できませんでした。' },
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
        photoUrl: true,
      },
    });

    if (!user)
      return NextResponse.json(
        { message: 'userが存在していませんでした。' },
        { status: 401 },
      );

    return NextResponse.json({
      message: 'sessionを確認しました。',
      user,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'sessionの検証に失敗しました。' },
      { status: 401 },
    );
  }
};

export const POST = async (req: NextRequest) => {
  try {
    /* カスタムfetch経由で送られてきた通信かを確認 */
    const authorization = req.headers.get('authorization');
    /* カスタムfetchの通信の中にtokenが確認できなかった場合の分岐 */
    if (!authorization?.startsWith('Bearer '))
      return NextResponse.json(
        { message: '認証トークンがありませんでした。' },
        { status: 401 },
      );

    /* headerの中からtokenを切り出す */
    const accessToken = authorization.slice('Bearer '.length);
    /* tokenの検証をし、正常であればpayloadが発行される */
    const payload = await verifyCognitoAccessToken(accessToken);

    /* 検証済みtokenを使い、Cognitoからuser属性を取得 */
    const cognitoUser = await getCognitoUser(accessToken);

    if (!cognitoUser)
      return NextResponse.json(
        { message: 'cognitoUserが取得できませんでした。' },
        { status: 401 },
      );

    if (!cognitoUser.sub || cognitoUser.sub !== payload.sub)
      return NextResponse.json(
        { message: 'tokenとuser情報が一致していませんでした。' },
        { status: 401 },
      );

    if (!cognitoUser.email || !cognitoUser.name || !cognitoUser.emailVerified)
      return NextResponse.json(
        { message: '必要なuser属性を確認できませんでした。' },
        { status: 403 },
      );

    /* 再実行されても重複しないようにuserを作成・更新 */
    const user = await prisma.user.upsert({
      where: {
        id: cognitoUser.sub,
      },
      update: {
        email: cognitoUser.email,
        name: cognitoUser.name,
      },
      create: {
        id: cognitoUser.sub,
        email: cognitoUser.email,
        name: cognitoUser.name,
      },
      select: {
        id: true,
      },
    });

    /* 自前のsession作成関数を使う。ここでpayload.uidを使わないのは、db経由で発行されたものと明確にするため */
    await createSession(user.id);

    return NextResponse.json({
      message: 'ログインしました。',
    });
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
    return NextResponse.json({
      message: 'sessionの削除を実施しました。',
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({
      message: 'sessionの削除ができませんでした。',
    });
  }
};
