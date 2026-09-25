import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';
import { canUserViewPost } from '@/server/src/queries/can-user-view-post';
import { createProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';

type RouteContext = {
  params: Promise<{ postId: string }>;
};

@Controller('post/:postId/comments')
export class PostPostidCommentsController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(request: Request, { params }: RouteContext) {
    try {
      const authorId = await getCurrentUser();
      if (!authorId)
        return Response.json(
          { message: 'ログインが必要です。' },
          { status: 401 },
        );

      const { postId } = await params;
      const body: unknown = await request.json();
      const content =
        typeof body === 'object' && body && 'content' in body
          ? String(body.content).trim()
          : '';

      if (!content || content.length > 1000)
        return Response.json(
          { message: 'コメントは1〜1000文字で入力してください。' },
          { status: 400 },
        );

      if (!(await canUserViewPost(postId, authorId)))
        return Response.json(
          { message: '公開記事が見つかりません。' },
          { status: 404 },
        );

      const comment = await prisma.comment.create({
        data: { content, postId, authorId },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: { select: { id: true, name: true, photoObjectKey: true } },
        },
      });

      let photoUrl: string | null = null;

      if (comment.author.photoObjectKey) {
        photoUrl = await createProfileImageViewUrl(
          comment.author.photoObjectKey,
        );
      }

      return Response.json(
        {
          message: 'コメントを投稿しました。',
          comment: {
            ...comment,
            createdAt: comment.createdAt.toISOString(),
            author: {
              id: comment.author.id,
              name: comment.author.name,
              photoUrl,
            },
          },
        },
        { status: 201 },
      );
    } catch (error) {
      console.error('コメントの投稿に失敗しました:', error);
      return Response.json(
        { message: 'コメントを投稿できませんでした。' },
        { status: 500 },
      );
    }

  }
}
