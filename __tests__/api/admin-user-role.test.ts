import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  findUniqueUser: vi.fn(),
  countUsers: vi.fn(),
  updateUser: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-admin', () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { PATCH } from '@/app/api/admin/users/[userId]/role/route';

const createRequest = (role: string) =>
  new NextRequest('http://localhost/api/admin/users/user-2/role', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });

const createContext = (userId = 'user-2') => ({
  params: Promise.resolve({ userId }),
});

describe('PATCH /api/admin/users/[userId]/role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin-1' });
    mocks.findUniqueUser.mockResolvedValue({ id: 'user-2', role: 'MEMBER' });
    mocks.countUsers.mockResolvedValue(2);
    mocks.updateUser.mockResolvedValue({ id: 'user-2', role: 'ADMIN' });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        user: {
          findUnique: mocks.findUniqueUser,
          count: mocks.countUsers,
          update: mocks.updateUser,
        },
      }),
    );
  });

  it('管理者でなければ403を返す', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    const response = await PATCH(createRequest('ADMIN'), createContext());

    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('自分自身の権限は変更できない', async () => {
    const response = await PATCH(
      createRequest('MEMBER'),
      createContext('admin-1'),
    );

    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('MEMBERをADMINへ変更する', async () => {
    const response = await PATCH(createRequest('ADMIN'), createContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual({ id: 'user-2', role: 'ADMIN' });
    expect(mocks.updateUser).toHaveBeenCalledWith({
      where: { id: 'user-2' },
      data: { role: 'ADMIN' },
      select: { id: true, role: true },
    });
  });

  it('最後の管理者はMEMBERへ変更できない', async () => {
    mocks.findUniqueUser.mockResolvedValue({ id: 'user-2', role: 'ADMIN' });
    mocks.countUsers.mockResolvedValue(1);

    const response = await PATCH(createRequest('MEMBER'), createContext());
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.message).toContain('最後の管理者');
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });
});
