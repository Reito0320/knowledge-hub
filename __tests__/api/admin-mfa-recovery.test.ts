import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  findUniqueUser: vi.fn(),
  createAuditLog: vi.fn(),
  updateAuditLog: vi.fn(),
  adminDeleteSoftwareToken: vi.fn(),
}));

vi.mock('@/lib/auth/get-current-admin', () => ({
  getCurrentAdmin: mocks.getCurrentAdmin,
}));

vi.mock('@/lib/AWS/admin-delete-software-token', () => ({
  adminDeleteSoftwareToken: mocks.adminDeleteSoftwareToken,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
    adminAuditLog: {
      create: mocks.createAuditLog,
      update: mocks.updateAuditLog,
    },
  },
}));

import { POST } from '@/app/api/admin/users/[userId]/mfa-recovery/route';

const createRequest = (
  body: unknown = {
    isIdentityVerified: true,
    reason: '本人と上長へ端末紛失を確認済み',
  },
) =>
  new NextRequest('http://localhost/api/admin/users/member-1/mfa-recovery', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

const createContext = () => ({
  params: Promise.resolve({ userId: 'member-1' }),
});

describe('POST /api/admin/users/[userId]/mfa-recovery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin-1' });
    mocks.findUniqueUser.mockResolvedValue({ id: 'member-1', role: 'MEMBER' });
    mocks.createAuditLog.mockResolvedValue({ id: 'audit-1' });
    mocks.updateAuditLog.mockResolvedValue({ id: 'audit-1' });
    mocks.adminDeleteSoftwareToken.mockResolvedValue(undefined);
  });

  it('管理者でなければ403を返す', async () => {
    mocks.getCurrentAdmin.mockResolvedValue(null);

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(403);
    expect(mocks.createAuditLog).not.toHaveBeenCalled();
    expect(mocks.adminDeleteSoftwareToken).not.toHaveBeenCalled();
  });

  it('本人確認が完了していなければ400を返す', async () => {
    const response = await POST(
      createRequest({
        isIdentityVerified: false,
        reason: '端末紛失を確認済み',
      }),
      createContext(),
    );

    expect(response.status).toBe(400);
    expect(mocks.createAuditLog).not.toHaveBeenCalled();
  });

  it('TOTPを削除して成功した監査ログを残す', async () => {
    const response = await POST(createRequest(), createContext());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('MFAを再設定できる状態にしました。');
    expect(mocks.createAuditLog).toHaveBeenCalledWith({
      data: {
        action: 'MFA_TOTP_RESET',
        status: 'PENDING',
        adminUserId: 'admin-1',
        targetUserId: 'member-1',
        reason: '本人と上長へ端末紛失を確認済み',
      },
      select: { id: true },
    });
    expect(mocks.adminDeleteSoftwareToken).toHaveBeenCalledWith('member-1');
    expect(mocks.updateAuditLog).toHaveBeenCalledWith({
      where: { id: 'audit-1' },
      data: {
        status: 'SUCCEEDED',
        errorMessage: undefined,
        completedAt: expect.any(Date),
      },
    });
  });

  it('Cognito操作に失敗したら502と失敗した監査ログを残す', async () => {
    mocks.adminDeleteSoftwareToken.mockRejectedValue(
      new Error('AWS connection failed'),
    );

    const response = await POST(createRequest(), createContext());

    expect(response.status).toBe(502);
    expect(mocks.updateAuditLog).toHaveBeenCalledWith({
      where: { id: 'audit-1' },
      data: {
        status: 'FAILED',
        errorMessage: 'AWS connection failed',
        completedAt: expect.any(Date),
      },
    });
  });
});
