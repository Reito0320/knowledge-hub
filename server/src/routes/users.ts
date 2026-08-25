import { Router } from 'express';
import { prisma } from '../lib/prisma.ts';
import { requireSession } from '../middleware/require-session.ts';

export const usersRouter = Router();

usersRouter.get('/me', requireSession, async (_req, res) => {
  try {
    /* middlewareで検証したuserIdが代入される */
    const userId = res.locals.userId as string;
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
      message: 'user情報の取得に失敗しました。',
    });
  }
});
