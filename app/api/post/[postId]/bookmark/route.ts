import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ postId: string }> };

export const POST = async (_request: Request, { params }: RouteContext) => {
  const userId = await getCurrentUser();
  if (!userId)
    return NextResponse.json({ message: 'ログインが必要です。' }, { status: 401 });

  const { postId } = await params;
  const post = await prisma.post.findFirst({
    where: { id: postId, status: 'PUBLISHED' },
    select: { id: true },
  });
  if (!post)
    return NextResponse.json({ message: '公開記事が見つかりません。' }, { status: 404 });

  const existing = await prisma.bookmark.findUnique({
    where: { userId_postId: { userId, postId } },
    select: { userId: true },
  });
  const bookmarked = !existing;
  const [, bookmarkCount] = await prisma.$transaction([
    existing
      ? prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } })
      : prisma.bookmark.create({ data: { userId, postId } }),
    prisma.bookmark.count({ where: { postId } }),
  ]);

  return NextResponse.json({ bookmarked, bookmarkCount });
};
