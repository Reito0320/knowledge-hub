import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const POST = async (
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) => {
  const followerId = await getCurrentUser();
  if (!followerId) {
    return NextResponse.json(
      { message: 'ログインが必要です。' },
      { status: 401 },
    );
  }

  const { userId: favoriteUserId } = await context.params;
  if (favoriteUserId === followerId) {
    return NextResponse.json(
      { message: '自分自身はお気に入りに追加できません。' },
      { status: 400 },
    );
  }

  const targetUser = await prisma.user.findFirst({
    where: { id: favoriteUserId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!targetUser) {
    return NextResponse.json(
      { message: '対象のユーザーが見つかりません。' },
      { status: 404 },
    );
  }

  const existing = await prisma.userFavorite.findUnique({
    where: { followerId_favoriteUserId: { followerId, favoriteUserId } },
    select: { followerId: true },
  });
  const favorited = !existing;

  if (existing) {
    await prisma.userFavorite.delete({
      where: { followerId_favoriteUserId: { followerId, favoriteUserId } },
    });
  } else {
    await prisma.userFavorite.create({
      data: { followerId, favoriteUserId },
    });
  }

  return NextResponse.json({ favorited });
};
