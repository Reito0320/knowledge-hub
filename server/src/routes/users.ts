import { Router } from 'express';
import { verifySessionToken } from '../lib/session.ts';
import { prisma } from '../lib/prisma.ts';

export const usersRouter = Router();

usersRouter.get('/me', async (req, res) => {
  try {
    /* cookie-parserで取得するcookieは非同期処理じゃないみたい */
    const session = req.cookies.session;
    if (!session)
      return res.status(401).json({
        message: 'session cookieが見つかりませんでした。',
      });
    const userId = await verifySessionToken(session);
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        photoUrl: true,
      },
    });

    if (!user)
      return res
        .status(403)
        .json({ message: 'ユーザーが見つかりませんでした。' });

    return res.status(200).json({ user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: 'session cookieの取得に失敗しました。',
    });
  }
});
