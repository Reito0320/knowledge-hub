import { verifyCognitoAccessToken } from '@/lib/amplify/cognito-verify-access-token';
import { getCognitoUser } from '@/lib/amplify/get-cognito-user';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

/**
 * userの情報をDBに保存するPOST api
 * @param req
 * @returns userId
 */
export const POST = async (req: NextRequest) => {
  try {
    const authorization = req.headers.get('authorization');
    if (!authorization?.startsWith('Bearer '))
      return NextResponse.json(
        {
          message: '認証された通信ではありません。',
        },
        { status: 401 },
      );

    const accessToken = authorization.slice('Bearer '.length);
    const payload = await verifyCognitoAccessToken(accessToken);
    const cognitoUser = await getCognitoUser(accessToken);

    /* cognitoUserの中の情報が正常かどうかの確認 */
    if (
      !payload.sub ||
      payload.sub !== cognitoUser?.sub ||
      !cognitoUser.email ||
      !cognitoUser.name
    ) {
      return NextResponse.json(
        {
          message: 'cognitoUserの中にuserの情報が確認できませんでした。',
        },
        { status: 403 },
      );
    }

    /* userがすでにDBにデータを保持しているなら、updateそうじゃなければcreate */
    const user = await prisma.user.upsert({
      where: {
        id: payload.sub,
      },
      update: {},
      create: {
        id: payload.sub,
        email: cognitoUser.email,
        name: cognitoUser.name,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      message: 'userの情報をDBに保存しました。',
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: 'userの情報をDBに保存できませんでした。',
        userId: null,
      },
      { status: 500 },
    );
  }
};
