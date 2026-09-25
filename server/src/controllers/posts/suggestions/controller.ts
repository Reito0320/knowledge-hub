import { Bind, Controller, Get } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

@Controller('posts/suggestions')
export class PostsSuggestionsController {
  @Get()
  @Bind(WebRequest(), WebParams())
  async GET(request: Request) {
    try {
      const currentUserId = await getCurrentUser();
      if (!currentUserId)
        return Response.json(
          { message: 'ログインが必要です。', posts: [] },
          { status: 401 },
        );

      const keyword = new URL(request.url).searchParams.get('q')?.trim() ?? '';
      if (!keyword) return Response.json({ posts: [] });

      const viewer = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { departmentId: true },
      });

      const posts = await prisma.post.findMany({
        where: {
          status: 'PUBLISHED',
          AND: [
            {
              OR: [
                { visibility: 'ORGANIZATION' },
                ...(viewer?.departmentId
                  ? [{ visibility: 'DEPARTMENT' as const, author: { departmentId: viewer.departmentId } }]
                  : []),
              ],
            },
          ],
          OR: [
            { title: { contains: keyword, mode: 'insensitive' } },
            { excerpt: { contains: keyword, mode: 'insensitive' } },
            {
              postTags: {
                some: {
                  tag: { name: { contains: keyword, mode: 'insensitive' } },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          category: true,
          author: { select: { name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        take: 6,
      });

      return Response.json({ posts });
    } catch (error) {
      console.error('記事候補の取得に失敗しました:', error);
      return Response.json(
        { message: '記事候補を取得できませんでした。', posts: [] },
        { status: 500 },
      );
    }

  }
}
