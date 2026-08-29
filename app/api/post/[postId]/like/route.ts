import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { canUserViewPost } from '@/lib/post/can-user-view-post';

type RouteContext = {
  params: Promise<{ postId: string }>;
};

// ログインユーザーのいいね状態を反転し、更新後の合計を返す。
export const POST = async (_request: Request, { params }: RouteContext) => {
  try {
    const userId = await getCurrentUser();
    if (!userId)
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const { postId } = await params;
    if (!(await canUserViewPost(postId, userId)))
      return NextResponse.json(
        { message: '公開記事が見つかりません。' },
        { status: 404 },
      );

    const existingLike = await prisma.postLike.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { userId: true },
    });

    const liked = !existingLike;
    const [, likeCount] = await prisma.$transaction([
      existingLike
        ? prisma.postLike.delete({
            where: { userId_postId: { userId, postId } },
          })
        : prisma.postLike.create({ data: { userId, postId } }),
      prisma.postLike.count({ where: { postId } }),
    ]);

    return NextResponse.json({ liked, likeCount });
  } catch (error) {
    console.error('いいねの更新に失敗しました:', error);
    return NextResponse.json(
      { message: 'いいねを更新できませんでした。' },
      { status: 500 },
    );
  }
};
