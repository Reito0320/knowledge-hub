import { verifyCognitoAccessToken } from '@/lib/AWS/cognito-verify-access-token';
import { getCognitoUser } from '@/lib/AWS/get-cognito-user';
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
    const body = (await req.json().catch(() => ({}))) as {
      departmentId?: unknown;
    };
    const departmentId =
      typeof body.departmentId === 'string' && body.departmentId
        ? body.departmentId
        : null;

    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });
      if (!department)
        return NextResponse.json(
          { message: '選択した部署が見つかりません。' },
          { status: 400 },
        );
    }

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
    const adminEmail = process.env.ADMIN_ACCOUNT_EMAIL;

    /* userがすでにDBにデータを保持しているなら、updateそうじゃなければcreate */
    const user = await prisma.user.upsert({
      where: {
        id: payload.sub,
      },
      update: departmentId ? { departmentId } : {},
      create: {
        id: payload.sub,
        email: cognitoUser.email,
        name: cognitoUser.name,
        departmentId,
        role: cognitoUser.email === adminEmail ? 'ADMIN' : 'MEMBER',
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
