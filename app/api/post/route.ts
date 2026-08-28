import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createPostTagData } from '../../(main)/post/edit/edit';
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

    const { title, excerpt, content, category, tags } = await req.json();
    const postTagData = createPostTagData(tags);

    await prisma.post.create({
      data: {
        title,
        excerpt,
        content,
        category,
        status: 'DRAFT',
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
        message: 'postの作成が完了しました。',
      },
      { status: 200 },
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

export const GET = async (req: NextRequest) => {
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
