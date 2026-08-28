import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId)
      return NextResponse.json(
        { message: 'ログインが必要です。', posts: [] },
        { status: 401 },
      );

    const keyword = request.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!keyword) return NextResponse.json({ posts: [] });

    const posts = await prisma.post.findMany({
      where: {
        status: 'PUBLISHED',
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

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('記事候補の取得に失敗しました:', error);
    return NextResponse.json(
      { message: '記事候補を取得できませんでした。', posts: [] },
      { status: 500 },
    );
  }
};
