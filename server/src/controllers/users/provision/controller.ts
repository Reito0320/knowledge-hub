import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getVerifiedCognitoSession } from '@/server/src/auth/request-user';
import { CognitoOnly } from '@/server/src/auth/auth.decorators';
import type { Prisma } from '@/lib/generated/prisma/client';
import { prisma } from '@/server/src/infrastructure/prisma';

/**
 * userの情報をDBに保存するPOST api
 * @param req
 * @returns userId
 */

@CognitoOnly()
@Controller('users/provision')
export class UsersProvisionController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(req: Request) {
    try {
      const authorization = req.headers.get('authorization');
      if (!authorization?.startsWith('Bearer '))
        return Response.json(
          {
            message: '認証された通信ではありません。',
          },
          { status: 401 },
        );

      const session = await getVerifiedCognitoSession();
      if (!session) return Response.json({ message: 'ログインが必要です。' }, { status: 401 });
      const { payload, cognitoUser } = session;
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
          return Response.json(
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
        return Response.json(
          {
            message: 'cognitoUserの中にuserの情報が確認できませんでした。',
          },
          { status: 403 },
        );
      }
      const adminEmail = process.env.ADMIN_ACCOUNT_EMAIL;
      const isInitialAdmin = cognitoUser.email === adminEmail;

      const updateData: Prisma.UserUpdateInput = {};
      const createData: Prisma.UserCreateInput = {
        id: payload.sub,
        email: cognitoUser.email,
        name: cognitoUser.name,
        role: isInitialAdmin ? 'ADMIN' : 'MEMBER',
        // 通常はすぐ利用可能にし、必要な場合だけ管理画面から状態を変更する。
        // status: 'ACTIVE',
      };

      // UserCreateInputでは外部キーを直接渡さず、Prismaのリレーションとして部署を接続する。
      if (departmentId) {
        updateData.department = {
          connect: { id: departmentId },
        };
        createData.department = {
          connect: { id: departmentId },
        };
      }

      /* userがすでにDBにデータを保持しているなら、updateそうじゃなければcreate */
      const user = await prisma.user.upsert({
        where: {
          id: payload.sub,
        },
        update: updateData,
        create: createData,
        select: {
          id: true,
        },
      });

      return Response.json({
        message: 'userの情報をDBに保存しました。',
        userId: user.id,
      });
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          message: 'userの情報をDBに保存できませんでした。',
          userId: null,
        },
        { status: 500 },
      );
    }

  }
}
