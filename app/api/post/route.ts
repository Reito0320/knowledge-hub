import { getCookie } from '@/lib/cookie';
import { decrypt } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { createPostTagData } from './post';

export const POST = async (req: NextRequest) => {
  try {
    const session = await getCookie('session');
    const payload = await decrypt(session);

    if (!payload || typeof payload.userId !== 'string')
      return NextResponse.json(
        {
          message: 'tokenが存在しませんでした。',
        },
        { status: 401 },
      );

    const authorId = payload.userId;
    const { title, excerpt, content, category, tags } = await req.json();
    const postTagData = createPostTagData(tags);

    await prisma.post.create({
      data: {
        title,
        excerpt,
        content,
        category,
        status: 'DRAFT',
        authorId,
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

export const GET = async () => {
  try {
  } catch (error) {}
};
