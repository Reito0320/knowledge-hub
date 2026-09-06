import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getCurrentAdmin: vi.fn(),
  findUnique: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  writeAudit: vi.fn(),
}));
vi.mock('@/lib/auth/get-current-admin', () => ({ getCurrentAdmin: mocks.getCurrentAdmin }));
vi.mock('@/lib/admin/write-admin-audit-log', () => ({ writeAdminAuditLog: mocks.writeAudit }));
vi.mock('@/lib/prisma', () => ({ prisma: { department: { findUnique: mocks.findUnique, findFirst: mocks.findFirst, create: mocks.create, update: mocks.update, delete: mocks.remove } } }));

import { POST } from '@/app/api/admin/departments/route';
import { DELETE } from '@/app/api/admin/departments/[departmentId]/route';

describe('管理者の部署設定', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCurrentAdmin.mockResolvedValue({ id: 'admin-1' });
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue({ id: 'department-1', name: '開発部' });
  });

  it('部署を追加する', async () => {
    const request = new Request('http://localhost', { method: 'POST', body: JSON.stringify({ name: ' 開発部 ' }) }) as NextRequest;
    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(mocks.create).toHaveBeenCalledWith({ data: { name: '開発部' }, select: { id: true, name: true } });
  });

  it('所属メンバーがいる部署は削除しない', async () => {
    mocks.findUnique.mockResolvedValue({ id: 'department-1', name: '開発部', _count: { members: 2 } });
    const response = await DELETE(new Request('http://localhost') as NextRequest, { params: Promise.resolve({ departmentId: 'department-1' }) });
    expect(response.status).toBe(409);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
