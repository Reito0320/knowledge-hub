import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = {
  params: Promise<{ postId: string }>;
};

export const POST = async (request: NextRequest, { params }: RouteContext) => {
  try {
    const authorId = await getCurrentUser();
    if (!authorId)
      return NextResponse.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const { postId } = await params;
    const body: unknown = await request.json();
    const content =
      typeof body === 'object' && body && 'content' in body
        ? String(body.content).trim()
        : '';

    if (!content || content.length > 1000)
      return NextResponse.json(
        { message: 'コメントは1〜1000文字で入力してください。' },
        { status: 400 },
      );

    const post = await prisma.post.findFirst({
      where: { id: postId, status: 'PUBLISHED' },
      select: { id: true },
    });
    if (!post)
      return NextResponse.json(
        { message: '公開記事が見つかりません。' },
        { status: 404 },
      );

    const comment = await prisma.comment.create({
      data: { content, postId, authorId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: { select: { id: true, name: true, photoUrl: true } },
      },
    });

    return NextResponse.json(
      {
        message: 'コメントを投稿しました。',
        comment: { ...comment, createdAt: comment.createdAt.toISOString() },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('コメントの投稿に失敗しました:', error);
    return NextResponse.json(
      { message: 'コメントを投稿できませんでした。' },
      { status: 500 },
    );
  }
};
