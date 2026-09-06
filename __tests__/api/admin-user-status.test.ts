import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  findUniqueUser: vi.fn(),
  updateUser: vi.fn(),
  adminSetUserEnabled: vi.fn(),
}));

vi.mock('@/lib/AWS/admin-set-user-enabled', () => ({
  adminSetUserEnabled: mocks.adminSetUserEnabled,
}));

vi.mock('@/lib/auth/get-current-admin', () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUniqueUser,
      update: mocks.updateUser,
    },
  },
}));

import { PATCH } from '@/app/api/admin/users/[userId]/status/route';

const createRequest = (status: string) =>
  new NextRequest('http://localhost/api/admin/users/user-2/status', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });

const createContext = (userId = 'user-2') => ({
  params: Promise.resolve({ userId }),
});

describe('PATCH /api/admin/users/[userId]/status', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin-1' });
    mocks.findUniqueUser.mockResolvedValue({
      id: 'user-2',
      status: 'PENDING',
    });
    mocks.updateUser.mockResolvedValue({ id: 'user-2', status: 'ACTIVE' });
    mocks.adminSetUserEnabled.mockResolvedValue(undefined);
  });

  it('管理者でなければ403を返す', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    const response = await PATCH(createRequest('ACTIVE'), createContext());

    expect(response.status).toBe(403);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('自分自身の利用状態は変更できない', async () => {
    const response = await PATCH(
      createRequest('SUSPENDED'),
      createContext('admin-1'),
    );

    expect(response.status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('承認待ちユーザーをACTIVEへ変更する', async () => {
    const response = await PATCH(createRequest('ACTIVE'), createContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual({ id: 'user-2', status: 'ACTIVE' });
    expect(mocks.adminSetUserEnabled).toHaveBeenCalledWith('user-2', true);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { status: 'ACTIVE' },
      select: { id: true, status: true },
    });
  });

  it('退職者はCognitoで無効化し、DBにはSUSPENDEDとして残す', async () => {
    mocks.updateUser.mockResolvedValue({ id: 'user-2', status: 'SUSPENDED' });

    const response = await PATCH(createRequest('SUSPENDED'), createContext());

    expect(response.status).toBe(200);
    expect(mocks.adminSetUserEnabled).toHaveBeenCalledWith('user-2', false);
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { status: 'SUSPENDED' },
      select: { id: true, status: true },
    });
  });

  it('Cognitoの無効化に失敗した場合はDBを変更しない', async () => {
    mocks.adminSetUserEnabled.mockRejectedValue(new Error('AWS failed'));

    const response = await PATCH(createRequest('SUSPENDED'), createContext());

    expect(response.status).toBe(500);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it('定義されていない状態は400を返す', async () => {
    const response = await PATCH(createRequest('UNKNOWN'), createContext());

    expect(response.status).toBe(400);
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
