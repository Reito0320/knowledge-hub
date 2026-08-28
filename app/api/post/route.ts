import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createPostTagData } from '@/lib/post/create-post-tag-data';
import { getCurrentUser } from '@/lib/auth/get-current-user';

export const POST = async (req: NextRequest) => {
  try {
    const currentUserId = await getCurrentUser();

    if (!currentUserId)
      return NextResponse.json(
        {
          message: 'tokenが存在しませんでした。',
        },
        { status: 401 },
      );

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

    const postTagData = createPostTagData(tags);

    const post = await prisma.post.create({
      data: {
        title: title.trim(),
        excerpt: typeof excerpt === 'string' ? excerpt.trim() || null : null,
        content,
        category,
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
      },
    });

    return NextResponse.json(
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
    return NextResponse.json(
      {
        message: 'postの作成に失敗しました。',
      },
      { status: 500 },
    );
  }
};

export const GET = async () => {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser)
      return NextResponse.json(
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
        viewCount: true,
        publishedAt: true,
        updatedAt: true,
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

    return NextResponse.json({
      message: '投稿の取得が完了しました。',
      data,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: '記事の取得に失敗しました。',
        data: null,
      },
      { status: 401 },
    );
  }
};
