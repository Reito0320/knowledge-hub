import { Bind, Controller, Get } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

@Controller('users/suggestions')
export class UsersSuggestionsController {
  @Get()
  @Bind(WebRequest(), WebParams())
  async GET(req: Request) {
    try {
      const currentUserId = await getCurrentUser();

      if (!currentUserId)
        return Response.json(
          { message: 'ログインが必要です。', users: [] },
          { status: 401 },
        );

      const keyword = new URL(req.url).searchParams.get('q')?.trim() ?? '';

      if (!keyword)
        return Response.json({
          message: '検索文字がありません。',
          users: [],
        });

      const users = await prisma.user.findMany({
        where: {
          // ログイン中の本人は検索候補へ表示しない。
          id: {
            not: currentUserId,
          },
          name: {
            contains: keyword,
            mode: 'insensitive',
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          department: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        take: 5,
      });

      return Response.json({
        message: 'メンバー候補を取得しました。',
        users,
      });
    } catch (error) {
      console.error(error);
      return Response.json(
        { message: 'メンバー候補を取得できませんでした。', users: [] },
        { status: 500 },
      );
    }

  }
}
