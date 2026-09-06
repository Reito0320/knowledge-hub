import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@/lib/generated/prisma/client';

const unauthorized = () =>
  NextResponse.json({ message: 'ログインが必要です。' }, { status: 401 });

export const GET = async () => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) return unauthorized();

    const viewer = await prisma.user.findUnique({
      where: { id: currentUserId },
      select: { departmentId: true },
    });
    if (!viewer) return unauthorized();

    // 公開後に範囲や所属が変わった場合も、現在閲覧できる通知だけを返す。
    const visiblePost: Prisma.PostWhereInput = {
      status: 'PUBLISHED' as const,
      OR: [
        { visibility: { in: ['ORGANIZATION', 'LINK'] } },
        ...(viewer.departmentId
          ? [
              {
                visibility: 'DEPARTMENT' as const,
                author: { departmentId: viewer.departmentId },
              },
            ]
          : []),
      ],
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: currentUserId, post: visiblePost },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          readAt: true,
          createdAt: true,
          post: {
            select: {
              id: true,
              title: true,
              author: { select: { name: true } },
            },
          },
        },
      }),
      prisma.notification.count({
        where: {
          recipientId: currentUserId,
          readAt: null,
          post: visiblePost,
        },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: '通知を取得できませんでした。' },
      { status: 500 },
    );
  }
};

export const PATCH = async (req: NextRequest) => {
  try {
    const currentUserId = await getCurrentUser();
    if (!currentUserId) return unauthorized();

    const body: unknown = await req.json();
    const notificationId =
      typeof body === 'object' &&
      body !== null &&
      'notificationId' in body &&
      typeof body.notificationId === 'string'
        ? body.notificationId
        : null;

    const result = await prisma.notification.updateMany({
      where: {
        recipientId: currentUserId,
        readAt: null,
        ...(notificationId ? { id: notificationId } : {}),
      },
      data: { readAt: new Date() },
    });

    return NextResponse.json({ updatedCount: result.count });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: '通知を既読にできませんでした。' },
      { status: 500 },
    );
  }
};
