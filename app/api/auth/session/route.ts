import { verifyCognitoAccessToken } from '@/lib/amplify/cognito-verify-access-token';
import { deleteCookie } from '@/lib/cookie';
import { prisma } from '@/lib/prisma';
import { createSession } from '@/lib/session';
import { NextRequest, NextResponse } from 'next/server';

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
    const payload = await verifyCognitoAccessToken(accessToken);

    /* cognito認証完了時に発行されるsubをDBのuserIdとして保存している場合に有効 */
    const user = await prisma.user.findUnique({
      where: {
        id: payload.sub,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user)
      return NextResponse.json(
        { message: 'userのデータが存在していませんでした。' },
        { status: 403 },
      );

    /* 自前のsession作成関数を使う */
    await createSession(user.id);

    return NextResponse.json({
      message: 'ログインしました。',
      user,
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
