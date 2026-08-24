import { Router } from 'express';
import { getCognitoUser, verifyCognitoAccessToken } from '../lib/cognito.ts';
import { prisma } from '../lib/prisma.ts';
import { createSessionToken } from '../lib/session.ts';
import { env } from '../config/env.ts';

export const sessionRouter = Router();

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

sessionRouter.post('/', async (req, res) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      res.status(401).json({ message: '認証トークンがありませんでした。' });
      return;
    }

    const accessToken = authorization.slice('Bearer '.length);
    const payload = await verifyCognitoAccessToken(accessToken);
    const cognitoUser = await getCognitoUser(accessToken);

    if (!cognitoUser.sub || cognitoUser.sub !== payload.sub) {
      res.status(401).json({
        message: 'TokenとCognitoユーザーが一致していませんでした。',
      });
      return;
    }

    if (!cognitoUser.email || !cognitoUser.name || !cognitoUser.emailVerified) {
      res.status(403).json({
        message: '必要なCognitoユーザー属性を確認できませんでした。',
      });
      return;
    }

    const user = await prisma.user.upsert({
      where: { id: cognitoUser.sub },
      update: {
        email: cognitoUser.email,
        name: cognitoUser.name,
      },
      create: {
        id: cognitoUser.sub,
        email: cognitoUser.email,
        name: cognitoUser.name,
      },
      select: { id: true },
    });

    const sessionToken = await createSessionToken(user.id);

    res.cookie('session', sessionToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 1000,
    });
    res.json({ message: 'ログインしました。' });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: '認証に失敗しました。' });
  }
});

sessionRouter.delete('/', (_req, res) => {
  res.clearCookie('session', cookieOptions);
  res.json({ message: 'Sessionを削除しました。' });
});
