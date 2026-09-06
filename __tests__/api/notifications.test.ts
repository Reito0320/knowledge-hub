import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  findUniqueUser: vi.fn(),
  findManyNotifications: vi.fn(),
  countNotifications: vi.fn(),
  updateManyNotifications: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-user', () => ({
  getCurrentUser: mocks.getCurrentUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: { findUnique: mocks.findUniqueUser },
    notification: {
      findMany: mocks.findManyNotifications,
      count: mocks.countNotifications,
      updateMany: mocks.updateManyNotifications,
    },
  },
}));

import { GET, PATCH } from '@/app/api/notifications/route';

describe('/api/notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentUser.mockResolvedValue('user-1');
    mocks.findUniqueUser.mockResolvedValue({ departmentId: 'department-1' });
    mocks.findManyNotifications.mockResolvedValue([]);
    mocks.countNotifications.mockResolvedValue(2);
    mocks.updateManyNotifications.mockResolvedValue({ count: 1 });
  });

  it('閲覧可能な最新通知と未読件数を返す', async () => {
    const response = await GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.unreadCount).toBe(2);
    expect(mocks.findManyNotifications).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ recipientId: 'user-1' }),
        take: 20,
      }),
    );
  });

  it('指定した自分の通知だけを既読にする', async () => {
    const response = await PATCH(
      new Request('http://localhost/api/notifications', {
        method: 'PATCH',
        body: JSON.stringify({ notificationId: 'notification-1' }),
      }) as NextRequest,
    );

    expect(response.status).toBe(200);
    expect(mocks.updateManyNotifications).toHaveBeenCalledWith({
      where: {
        recipientId: 'user-1',
        readAt: null,
        id: 'notification-1',
      },
      data: { readAt: expect.any(Date) },
    });
  });

  it('未ログインでは通知を返さない', async () => {
    mocks.getCurrentUser.mockResolvedValue(undefined);

    const response = await GET();

    expect(response.status).toBe(401);
    expect(mocks.findManyNotifications).not.toHaveBeenCalled();
  });
});
