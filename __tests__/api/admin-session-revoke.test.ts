import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  findUniqueUser: vi.fn(),
  globalSignOut: vi.fn(),
  writeAudit: vi.fn(),
}));

vi.mock('@/server/src/auth/request-user', () => ({ getCurrentAdmin: mocks.getCurrentAdmin }));
vi.mock('@/server/src/infrastructure/aws/admin-user-global-sign-out', () => ({ adminUserGlobalSignOut: mocks.globalSignOut }));
vi.mock('@/server/src/infrastructure/write-admin-audit-log', () => ({ writeAdminAuditLog: mocks.writeAudit }));
vi.mock('@/server/src/infrastructure/prisma', () => ({ prisma: { user: { findUnique: mocks.findUniqueUser } } }));

import { AdminUsersUseridSessionController } from '@/server/src/controllers/admin/users/[userId]/session/controller';
const { POST } = new AdminUsersUseridSessionController();

describe('POST /api/admin/users/[userId]/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin-1' });
    mocks.findUniqueUser.mockResolvedValue({ id: 'user-1' });
  });

  it('対象ユーザーのCognito全セッションを失効して監査記録を残す', async () => {
    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ reason: '端末紛失' }) }) as Request;
    const response = await POST(request, { params: Promise.resolve({ userId: 'user-1' }) });
    expect(response.status).toBe(200);
    expect(mocks.globalSignOut).toHaveBeenCalledWith('user-1');
    expect(mocks.writeAudit).toHaveBeenCalledWith(expect.objectContaining({ action: 'USER_SESSION_REVOKED', reason: '端末紛失' }));
  });

  it('自分自身は失効できない', async () => {
    const request = new Request('http://localhost', { method: 'POST', body: '{}' }) as Request;
    const response = await POST(request, { params: Promise.resolve({ userId: 'admin-1' }) });
    expect(response.status).toBe(400);
    expect(mocks.globalSignOut).not.toHaveBeenCalled();
  });
});
