import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

@Controller('users/:userId/favorite')
export class UsersUseridFavoriteController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(
    _request: Request,
    context: { params: Promise<{ userId: string }> },
  ) {
    const followerId = await getCurrentUser();
    if (!followerId) {
      return Response.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );
    }

    const { userId: favoriteUserId } = await context.params;
    if (favoriteUserId === followerId) {
      return Response.json(
        { message: '自分自身はお気に入りに追加できません。' },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findFirst({
      where: { id: favoriteUserId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!targetUser) {
      return Response.json(
        { message: '対象のユーザーが見つかりません。' },
        { status: 404 },
      );
    }

    const existing = await prisma.userFavorite.findUnique({
      where: { followerId_favoriteUserId: { followerId, favoriteUserId } },
      select: { followerId: true },
    });
    const favorited = !existing;

    if (existing) {
      await prisma.userFavorite.delete({
        where: { followerId_favoriteUserId: { followerId, favoriteUserId } },
      });
    } else {
      await prisma.userFavorite.create({
        data: { followerId, favoriteUserId },
      });
    }

    return Response.json({ favorited });

  }
}
