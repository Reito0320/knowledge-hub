import { Bind, Controller, Get } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { createPostImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { canViewPost } from '@/lib/post/post-visibility';
import { prisma } from '@/server/src/infrastructure/prisma';

const validOwnerId = /^[A-Za-z0-9_-]{1,128}$/;
const validFileName = /^[0-9a-f-]{36}\.(jpg|png|webp)$/;

@Controller('post/images/:ownerId/:fileName')
export class PostImagesOwneridFilenameController {
  @Get()
  @Bind(WebRequest(), WebParams())
  async GET(
    _request: Request,
    context: { params: Promise<{ ownerId: string; fileName: string }> },
  ) {
    try {
      const currentUserId = await getCurrentUser();
      if (!currentUserId) {
        return Response.json(
          { message: 'ログインが必要です。' },
          { status: 401 },
        );
      }

      const { ownerId, fileName } = await context.params;
      if (!validOwnerId.test(ownerId) || !validFileName.test(fileName)) {
        return Response.json(
          { message: '画像の指定が正しくありません。' },
          { status: 400 },
        );
      }

      const markdownUrl = `/api/post/images/${ownerId}/${fileName}`;

      if (ownerId !== currentUserId) {
        const [viewer, posts] = await Promise.all([
          prisma.user.findUnique({
            where: { id: currentUserId },
            select: { id: true, departmentId: true },
          }),
          prisma.post.findMany({
            where: { content: { contains: markdownUrl } },
            select: {
              authorId: true,
              status: true,
              visibility: true,
              author: { select: { departmentId: true } },
            },
          }),
        ]);

        if (!viewer || !posts.some((post) => canViewPost(post, viewer))) {
          return Response.json(
            { message: 'この画像を表示する権限がありません。' },
            { status: 403 },
          );
        }
      }

      const viewUrl = await createPostImageViewUrl(
        `post-images/${ownerId}/${fileName}`,
      );
      const response = new Response(null, { status: 307, headers: { Location: viewUrl } });
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    } catch (error) {
      console.error('記事画像を表示できませんでした:', error);
      return Response.json(
        { message: '記事画像を表示できませんでした。' },
        { status: 500 },
      );
    }

  }
}
