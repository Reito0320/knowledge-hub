import { writeAdminAuditLog } from '@/lib/admin/write-admin-audit-log';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (request: NextRequest) => {
  const admin = await getCurrentAdmin();
  if (!admin) return NextResponse.json({ message: '管理者権限が必要です。' }, { status: 403 });
  const body: unknown = await request.json().catch(() => null);
  const name = typeof body === 'object' && body !== null && 'name' in body && typeof body.name === 'string' ? body.name.trim() : '';
  if (!name || name.length > 80) return NextResponse.json({ message: '部署名を1〜80文字で入力してください。' }, { status: 400 });
  const duplicate = await prisma.department.findUnique({ where: { name }, select: { id: true } });
  if (duplicate) return NextResponse.json({ message: '同じ部署名がすでに存在します。' }, { status: 409 });
  const department = await prisma.department.create({ data: { name }, select: { id: true, name: true } });
  await writeAdminAuditLog({ action: 'DEPARTMENT_CREATED', adminUserId: admin.id, targetUserId: department.id, reason: `部署「${name}」を追加` });
  return NextResponse.json({ message: '部署を追加しました。', department }, { status: 201 });
};
