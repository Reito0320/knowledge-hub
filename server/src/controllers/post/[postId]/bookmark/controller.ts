import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';
import { canUserViewPost } from '@/server/src/queries/can-user-view-post';

type RouteContext = { params: Promise<{ postId: string }> };

@Controller('post/:postId/bookmark')
export class PostPostidBookmarkController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(_request: Request, { params }: RouteContext) {
    const userId = await getCurrentUser();
    if (!userId)
      return Response.json({ message: 'ログインが必要です。' }, { status: 401 });

    const { postId } = await params;
    if (!(await canUserViewPost(postId, userId)))
      return Response.json({ message: '公開記事が見つかりません。' }, { status: 404 });

    const existing = await prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { userId: true },
    });
    const bookmarked = !existing;
    const [, bookmarkCount] = await prisma.$transaction([
      existing
        ? prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } })
        : prisma.bookmark.create({ data: { userId, postId } }),
      prisma.bookmark.count({ where: { postId } }),
    ]);

    return Response.json({ bookmarked, bookmarkCount });

  }
}
