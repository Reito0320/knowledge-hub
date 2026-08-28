import { getCurrentUser } from '@/lib/auth/get-current-user';
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

    const targetPost = await prisma.post.findFirst({
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
      },
    });
    return NextResponse.json({
      message: '一件検索の記事取得ができました。',
      targetPost,
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
