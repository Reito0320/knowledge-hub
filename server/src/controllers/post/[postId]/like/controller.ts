import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';
import { canUserViewPost } from '@/server/src/queries/can-user-view-post';

type RouteContext = {
  params: Promise<{ postId: string }>;
};

// ログインユーザーのいいね状態を反転し、更新後の合計を返す。

@Controller('post/:postId/like')
export class PostPostidLikeController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(_request: Request, { params }: RouteContext) {
    try {
      const userId = await getCurrentUser();
      if (!userId)
        return Response.json(
          { message: 'ログインが必要です。' },
          { status: 401 },
        );

      const { postId } = await params;
      if (!(await canUserViewPost(postId, userId)))
        return Response.json(
          { message: '公開記事が見つかりません。' },
          { status: 404 },
        );

      const existingLike = await prisma.postLike.findUnique({
        where: { userId_postId: { userId, postId } },
        select: { userId: true },
      });

      const liked = !existingLike;
      const [, likeCount] = await prisma.$transaction([
        existingLike
          ? prisma.postLike.delete({
            where: { userId_postId: { userId, postId } },
          })
          : prisma.postLike.create({ data: { userId, postId } }),
        prisma.postLike.count({ where: { postId } }),
      ]);

      return Response.json({ liked, likeCount });
    } catch (error) {
      console.error('いいねの更新に失敗しました:', error);
      return Response.json(
        { message: 'いいねを更新できませんでした。' },
        { status: 500 },
      );
    }

  }
}
