import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (req: NextRequest) => {
  try {
    const currentUserId = await getCurrentUser();

    if (!currentUserId)
      return NextResponse.json(
        { message: 'ログインが必要です。', users: [] },
        { status: 401 },
      );

    const keyword = req.nextUrl.searchParams.get('q')?.trim() ?? '';

    if (!keyword)
      return NextResponse.json({
        message: '検索文字がありません。',
        users: [],
      });

    const users = await prisma.user.findMany({
      where: {
        // ログイン中の本人は検索候補へ表示しない。
        id: {
          not: currentUserId,
        },
        name: {
          contains: keyword,
          mode: 'insensitive',
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
      take: 5,
    });

    return NextResponse.json({
      message: 'メンバー候補を取得しました。',
      users,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'メンバー候補を取得できませんでした。', users: [] },
      { status: 500 },
    );
  }
};
