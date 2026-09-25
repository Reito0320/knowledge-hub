import { Bind, Controller, Get, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { prisma } from '@/server/src/infrastructure/prisma';
import { createPostTagData } from '@/lib/post/create-post-tag-data';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { isPostVisibility } from '@/lib/post/post-visibility';
import { createNewPostNotifications } from '@/server/src/infrastructure/create-new-post-notifications';
import { createOptionalProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';

@Controller('post')
export class PostController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(req: Request) {
    try {
      const currentUserId = await getCurrentUser();

      if (!currentUserId)
        return Response.json(
          {
            message: 'tokenが存在しませんでした。',
          },
          { status: 401 },
        );

      const { title, excerpt, content, category, visibility, tags, publish } =
        await req.json();
      const shouldPublish = publish === true;

      if (
        typeof title !== 'string' ||
        typeof content !== 'string' ||
        (category !== 'TECH' && category !== 'BUSINESS') ||
        !isPostVisibility(visibility) ||
        !Array.isArray(tags)
      )
        return Response.json(
          { message: '記事の入力値が正しくありません。' },
          { status: 400 },
        );

      if (shouldPublish && (!title.trim() || !content.trim()))
        return Response.json(
          { message: '公開するにはタイトルと本文が必要です。' },
          { status: 400 },
        );

      const postTagData = createPostTagData(tags);

      const post = await prisma.$transaction(async (tx) => {
        const createdPost = await tx.post.create({
          data: {
            title: title.trim(),
            excerpt: typeof excerpt === 'string' ? excerpt.trim() || null : null,
            content,
            category,
            visibility,
            status: shouldPublish ? 'PUBLISHED' : 'DRAFT',
            publishedAt: shouldPublish ? new Date() : null,
            authorId: currentUserId,
            postTags: {
              create: postTagData,
            },
          },
          select: {
            id: true,
            updatedAt: true,
            authorId: true,
            visibility: true,
            author: { select: { departmentId: true } },
          },
        });

        if (shouldPublish) {
          await createNewPostNotifications(tx, {
            id: createdPost.id,
            authorId: createdPost.authorId,
            authorDepartmentId: createdPost.author.departmentId,
            visibility: createdPost.visibility,
          });
        }

        return createdPost;
      });

      return Response.json(
        {
          message: shouldPublish
            ? '記事を公開しました。'
            : '下書きを保存しました。',
          postId: post.id,
        },
        { status: 201 },
      );
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          message: 'postの作成に失敗しました。',
        },
        { status: 500 },
      );
    }

  }

  @Get()
  @Bind(WebRequest(), WebParams())
  async GET() {
    try {
      const currentUser = await getCurrentUser();
      if (!currentUser)
        return Response.json(
          {
            message: 'tokenが存在しませんでした。',
          },
          { status: 401 },
        );

      const data = await prisma.post.findMany({
        where: {
          authorId: currentUser,
        },
        select: {
          id: true,
          title: true,
          excerpt: true,
          category: true,
          status: true,
          visibility: true,
          viewCount: true,
          publishedAt: true,
          updatedAt: true,
          author: { select: { name: true, photoObjectKey: true } },
          postTags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      const posts = await Promise.all(
        data.map(async (post) => ({
          ...post,
          author: {
            name: post.author.name,
            photoUrl: await createOptionalProfileImageViewUrl(
              post.author.photoObjectKey,
            ),
          },
        })),
      );

      return Response.json({
        message: '投稿の取得が完了しました。',
        data: posts,
      });
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          message: '記事の取得に失敗しました。',
          data: null,
        },
        { status: 401 },
      );
    }

  }
}
