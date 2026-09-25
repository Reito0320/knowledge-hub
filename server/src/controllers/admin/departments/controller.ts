import { AdminOnly } from '@/server/src/auth/auth.decorators';
import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { writeAdminAuditLog } from '@/server/src/infrastructure/write-admin-audit-log';
import { getCurrentAdmin } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

@AdminOnly()
@Controller('admin/departments')
export class AdminDepartmentsController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(request: Request) {
    const admin = await getCurrentAdmin();
    if (!admin) return Response.json({ message: '管理者権限が必要です。' }, { status: 403 });
    const body: unknown = await request.json().catch(() => null);
    const name = typeof body === 'object' && body !== null && 'name' in body && typeof body.name === 'string' ? body.name.trim() : '';
    if (!name || name.length > 80) return Response.json({ message: '部署名を1〜80文字で入力してください。' }, { status: 400 });
    const duplicate = await prisma.department.findUnique({ where: { name }, select: { id: true } });
    if (duplicate) return Response.json({ message: '同じ部署名がすでに存在します。' }, { status: 409 });
    const department = await prisma.department.create({ data: { name }, select: { id: true, name: true } });
    await writeAdminAuditLog({ action: 'DEPARTMENT_CREATED', adminUserId: admin.id, targetUserId: department.id, reason: `部署「${name}」を追加` });
    return Response.json({ message: '部署を追加しました。', department }, { status: 201 });

  }
}
