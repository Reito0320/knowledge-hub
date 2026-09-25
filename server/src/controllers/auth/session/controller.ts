import { Bind, Controller, Inject, Delete, Get, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { createProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';
import { COGNITO_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { getVerifiedCognitoSession } from '@/server/src/auth/request-user';
import { AuthService } from '@/server/src/auth/auth.service';
import { CognitoOnly, Public } from '@/server/src/auth/auth.decorators';
import { deleteCookie, setCookie } from '@/server/src/http/cookie';
import { prisma } from '@/server/src/infrastructure/prisma';

/**
 * Cognito Access Tokenを確認し、subからUser情報を取得するGET API。
 * @returns
 */


/**
 * Cognito Access Tokenを検証し、Server Componentでも利用できるよう
 * Token自体をHttpOnly Cookieへ保存する。
 * @returns void
 */

@Controller('auth/session')
export class AuthSessionController {
  @Inject(AuthService) private readonly auth!: AuthService;
  @CognitoOnly()
  @Get()
  @Bind(WebRequest(), WebParams())
  async GET() {
    try {
      const session = await getVerifiedCognitoSession();
      if (!session) {
        await deleteCookie(COGNITO_ACCESS_TOKEN_COOKIE);
        return Response.json(
          {
            message: '有効なCognitoセッションがありません。',
          },
          { status: 401 },
        );
      }

      const user = await prisma.user.findUnique({
        where: {
          id: session.payload.sub,
        },
        select: {
          id: true,
          name: true,
          email: true,
          photoObjectKey: true,
          jobTitle: true,
          bio: true,
          role: true,
          status: true,
          department: { select: { id: true, name: true } },
        },
      });

      if (!user)
        return Response.json(
          {
            message: 'userが存在していませんでした。',
          },
          { status: 401 },
        );

      if (user.status !== 'ACTIVE') {
        await deleteCookie(COGNITO_ACCESS_TOKEN_COOKIE);

        let message = 'このアカウントは利用停止中です。';
        if (user.status === 'PENDING') message = '管理者の承認待ちです。';

        return Response.json({ message }, { status: 403 });
      }

      let photoUrl: string | null = null;

      if (user.photoObjectKey) {
        try {
          photoUrl = await createProfileImageViewUrl(user.photoObjectKey);
        } catch (error) {
          // S3の一時障害でログイン状態まで失わせず、画像なしでユーザー情報を返す。
          console.error('プロフィール画像URLを発行できませんでした:', error);
        }
      }

      return Response.json({
        message: 'sessionを確認しました。',
        user: {
          ...user,
          photoObjectKey: undefined,
          photoUrl,
        },
      });
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          message: 'sessionの検証に失敗しました。',
        },
        { status: 401 },
      );
    }

  }

  @Public()
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(req: Request) {
    try {
      /* カスタムfetch経由で送られてきた通信かを確認 */
      const authorization = req.headers.get('authorization');
      /* カスタムfetchの通信の中にtokenが確認できなかった場合の分岐 */
      if (!authorization?.startsWith('Bearer '))
        return Response.json(
          {
            message: '認証トークンがありませんでした。',
          },
          { status: 401 },
        );

      /* headerの中からtokenを切り出す */
      const accessToken = authorization.slice('Bearer '.length);
      /* tokenの検証をし、正常であればpayloadが発行される */
      const cognitoSession = await this.auth.verifyAccessToken(accessToken);
      if (!cognitoSession) {
        return Response.json(
          { message: 'Cognitoで有効な認証トークンではありません。' },
          { status: 401 },
        );
      }
      const { payload } = cognitoSession;

      if (!payload.sub)
        return Response.json(
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
          status: true,
        },
      });

      if (!user)
        return Response.json(
          {
            message: 'アプリのUserが作成されていません。',
          },
          { status: 403 },
        );

      if (user.status === 'PENDING') {
        return Response.json(
          { message: '管理者の承認待ちです。' },
          { status: 403 },
        );
      }

      if (user.status === 'SUSPENDED') {
        return Response.json(
          { message: 'このアカウントは利用停止中です。' },
          { status: 403 },
        );
      }

      const nowInSeconds = Math.floor(Date.now() / 1000);
      const maxAge = payload.exp ? Math.max(1, payload.exp - nowInSeconds) : 3600;
      await setCookie(COGNITO_ACCESS_TOKEN_COOKIE, accessToken, req.headers.get('X-Remember-Me') === 'true' ? maxAge : null);

      return Response.json(
        {
          message: 'ログインしました。',
        },
        { status: 200 },
      );
    } catch (error) {
      console.error(error);
      return Response.json(
        { message: '認証に失敗しました。' },
        { status: 401 },
      );
    }

  }

  @Public()
  @Delete()
  @Bind(WebRequest(), WebParams())
  async DELETE() {
    try {
      await Promise.all([
        deleteCookie(COGNITO_ACCESS_TOKEN_COOKIE),
        // 移行前の独自Session Cookieが残っていれば同時に破棄する。
        deleteCookie('session'),
      ]);
      return Response.json(
        {
          message: 'sessionの削除を実施しました。',
        },
        { status: 200 },
      );
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          message: 'sessionの削除ができませんでした。',
        },
        { status: 401 },
      );
    }

  }
}
