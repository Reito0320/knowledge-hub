import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    const currentUserId = await getCurrentUser();

    if (!currentUserId)
      return NextResponse.json(
        { message: 'ログインが必要です。', tags: [] },
        { status: 401 },
      );

    const keyword = req.nextUrl.searchParams.get('q')?.trim() ?? '';
    if (!keyword) return NextResponse.json({ tags: [] });

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
      take: 5,
    });

    return NextResponse.json({ tags });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'タグ候補を取得できませんでした。', tags: [] },
      { status: 500 },
    );
  }
};
