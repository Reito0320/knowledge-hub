import { getCurrentUser } from '@/lib/auth/get-current-user';
import { createPostTagData } from '@/lib/post/create-post-tag-data';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{
    postId: string;
  }>;
};

export const GET = async (_req: NextRequest, { params }: RouteContext) => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId)
      return NextResponse.json(
        {
          message: 'tokenが確認できませんでした。',
          data: null,
        },
        {
          status: 401,
        },
      );
    const { postId } = await params;

    const targetPost = await prisma.post.findUnique({
      where: {
        id: postId,
      },
      select: {
        title: true,
        excerpt: true,
        content: true,
        category: true,
        status: true,
        viewCount: true,
        publishedAt: true,
        updatedAt: true,
        authorId: true,
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
              select: { id: true, name: true, photoUrl: true },
            },
          },
        },
        likes: {
          where: { userId: currentUserId },
          select: { userId: true },
          take: 1,
        },
        _count: { select: { likes: true, comments: true } },
      },
    });

    if (!targetPost)
      return NextResponse.json(
        {
          message: '記事が存在しませんでした。',
          targetPost: null,
        },
        { status: 404 },
      );

    const canEdit = targetPost.authorId === currentUserId;

    if (targetPost.status !== 'PUBLISHED' && !canEdit)
      return NextResponse.json(
        {
          message: 'この記事を閲覧する権限がありません。',
          targetPost: null,
        },
        { status: 403 },
      );

    return NextResponse.json({
      message: '一件検索の記事取得ができました。',
      targetPost: {
        ...targetPost,
        canEdit,
        likedByCurrentUser: targetPost.likes.length > 0,
        likes: undefined,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: '一件検索の記事取得に失敗しました。',
        targetPost: null,
      },
      { status: 401 },
    );
  }
};

export const PATCH = async (req: NextRequest, { params }: RouteContext) => {
  try {
    const currentUserId = await getCurrentUser();

    if (!currentUserId)
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const { postId } = await params;
    const { title, excerpt, content, category, tags, publish } =
      await req.json();
    const shouldPublish = publish === true;

    if (
      typeof title !== 'string' ||
      typeof content !== 'string' ||
      (category !== 'TECH' && category !== 'BUSINESS') ||
      !Array.isArray(tags)
    )
      return NextResponse.json(
        { message: '記事の入力値が正しくありません。' },
        { status: 400 },
      );

    if (shouldPublish && (!title.trim() || !content.trim()))
      return NextResponse.json(
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
      },
    });

    if (!targetPost)
      return NextResponse.json(
        { message: '記事が存在しないか、編集権限がありません。' },
        { status: 403 },
      );

    const postTagData = createPostTagData(tags);

    await prisma.post.update({
      where: {
        id: targetPost.id,
      },
      data: {
        title: title.trim(),
        excerpt: typeof excerpt === 'string' ? excerpt.trim() || null : null,
        content,
        category,
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
    });

    return NextResponse.json({
      message: shouldPublish
        ? '記事を公開しました。'
        : '記事を更新しました。',
      postId: targetPost.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: '記事の更新に失敗しました。' },
      { status: 500 },
    );
  }
};
