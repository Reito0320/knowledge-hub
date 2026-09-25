import { Bind, Controller, Get } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

@Controller('tags/suggestions')
export class TagsSuggestionsController {
  @Get()
  @Bind(WebRequest(), WebParams())
  async GET(req: Request) {
    try {
      const currentUserId = await getCurrentUser();

      if (!currentUserId)
        return Response.json(
          { message: 'ログインが必要です。', tags: [] },
          { status: 401 },
        );

      const keyword = new URL(req.url).searchParams.get('q')?.trim() ?? '';
      if (!keyword) return Response.json({ tags: [] });

      const tags = await prisma.tag.findMany({
        where: {
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          slug: true,
        },
        orderBy: { name: 'asc' },
        take: 5,
      });

      return Response.json({ tags });
    } catch (error) {
      console.error(error);
      return Response.json(
        { message: 'タグ候補を取得できませんでした。', tags: [] },
        { status: 500 },
      );
    }

  }
}
