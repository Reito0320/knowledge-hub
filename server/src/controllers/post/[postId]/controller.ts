import { Bind, Controller, Delete, Get, Patch } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { createPostTagData } from '@/lib/post/create-post-tag-data';
import { prisma } from '@/server/src/infrastructure/prisma';
import { canViewPost, isPostVisibility } from '@/lib/post/post-visibility';
import { createProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';
import { createNewPostNotifications } from '@/server/src/infrastructure/create-new-post-notifications';

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

@Controller('post/:postId')
export class PostPostidController {
  @Get()
  @Bind(WebRequest(), WebParams())
  async GET(_req: Request, { params }: RouteContext) {
    try {
      const currentUserId = await getCurrentUser();
      if (!currentUserId)
        return Response.json(
          {
            message: 'tokenが確認できませんでした。',
            data: null,
          },
          {
            status: 401,
          },
        );
      const { postId } = await params;

      const [targetPost, viewer] = await Promise.all([
        prisma.post.findUnique({
          where: {
            id: postId,
          },
          select: {
            title: true,
            excerpt: true,
            content: true,
            category: true,
            status: true,
            visibility: true,
            viewCount: true,
            publishedAt: true,
            updatedAt: true,
            authorId: true,
            author: { select: { departmentId: true } },
            postTags: {
              select: {
                tag: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                  },
                },
              },
            },
            comments: {
              where: { parentId: null },
              orderBy: { createdAt: 'asc' },
              select: {
                id: true,
                content: true,
                createdAt: true,
                author: {
                  select: { id: true, name: true, photoObjectKey: true },
                },
              },
            },
            likes: {
              where: { userId: currentUserId },
              select: { userId: true },
              take: 1,
            },
            bookmarks: {
              where: { userId: currentUserId },
              select: { userId: true },
              take: 1,
            },
            _count: { select: { likes: true, comments: true, bookmarks: true } },
          },
        }),
        prisma.user.findUnique({
          where: { id: currentUserId },
          select: { id: true, departmentId: true },
        }),
      ]);

      if (!targetPost)
        return Response.json(
          {
            message: '記事が存在しませんでした。',
            targetPost: null,
          },
          { status: 404 },
        );

      if (!viewer)
        return Response.json(
          { message: 'ユーザー情報が見つかりません。', targetPost: null },
          { status: 401 },
        );

      const canEdit = targetPost.authorId === currentUserId;

      if (!canViewPost(targetPost, viewer))
        return Response.json(
          {
            message: 'この記事を閲覧する権限がありません。',
            targetPost: null,
          },
          { status: 403 },
        );

      const comments = await Promise.all(
        targetPost.comments.map(async (comment) => {
          let photoUrl: string | null = null;

          if (comment.author.photoObjectKey) {
            photoUrl = await createProfileImageViewUrl(
              comment.author.photoObjectKey,
            );
          }

          return {
            ...comment,
            author: {
              id: comment.author.id,
              name: comment.author.name,
              photoUrl,
            },
          };
        }),
      );

      return Response.json({
        message: '一件検索の記事取得ができました。',
        targetPost: {
          ...targetPost,
          comments,
          canEdit,
          likedByCurrentUser: targetPost.likes.length > 0,
          bookmarkedByCurrentUser: targetPost.bookmarks.length > 0,
          likes: undefined,
          bookmarks: undefined,
          author: undefined,
        },
      });
    } catch (error) {
      console.error(error);
      return Response.json(
        {
          message: '一件検索の記事取得に失敗しました。',
          targetPost: null,
        },
        { status: 401 },
      );
    }

  }

  @Delete()
  @Bind(WebRequest(), WebParams())
  async DELETE(_req: Request, { params }: RouteContext) {
    const currentUserId = await getCurrentUser();
    if (!currentUserId)
      return Response.json({ message: 'ログインが必要です。' }, { status: 401 });

    const { postId } = await params;
    const result = await prisma.post.deleteMany({
      where: { id: postId, authorId: currentUserId },
    });
    if (result.count === 0)
      return Response.json(
        { message: '記事がないか、削除権限がありません。' },
        { status: 404 },
      );

    return Response.json({ message: '記事を削除しました。' });

  }

  @Patch()
  @Bind(WebRequest(), WebParams())
  async PATCH(req: Request, { params }: RouteContext) {
    try {
      const currentUserId = await getCurrentUser();

      if (!currentUserId)
        return Response.json(
          { message: 'ログインが必要です。' },
          { status: 401 },
        );

      const { postId } = await params;
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

      const targetPost = await prisma.post.findFirst({
        where: {
          id: postId,
          authorId: currentUserId,
        },
        select: {
          id: true,
          publishedAt: true,
          authorId: true,
        },
      });

      if (!targetPost)
        return Response.json(
          { message: '記事が存在しないか、編集権限がありません。' },
          { status: 403 },
        );

      const postTagData = createPostTagData(tags);

      await prisma.$transaction(async (tx) => {
        const updatedPost = await tx.post.update({
          where: {
            id: targetPost.id,
          },
          data: {
            title: title.trim(),
            excerpt: typeof excerpt === 'string' ? excerpt.trim() || null : null,
            content,
            category,
            visibility,
            ...(shouldPublish
              ? {
                status: 'PUBLISHED' as const,
                publishedAt: targetPost.publishedAt ?? new Date(),
              }
              : {}),
            postTags: {
              deleteMany: {},
              create: postTagData,
            },
          },
          select: {
            id: true,
            authorId: true,
            visibility: true,
            author: { select: { departmentId: true } },
          },
        });

        if (shouldPublish && targetPost.publishedAt === null) {
          await createNewPostNotifications(tx, {
            id: updatedPost.id,
            authorId: updatedPost.authorId,
            authorDepartmentId: updatedPost.author.departmentId,
            visibility: updatedPost.visibility,
          });
        }
      });

      return Response.json({
        message: shouldPublish
          ? '記事を公開しました。'
          : '記事を更新しました。',
        postId: targetPost.id,
      });
    } catch (error) {
      console.error(error);
      return Response.json(
        { message: '記事の更新に失敗しました。' },
        { status: 500 },
      );
    }

  }
}
