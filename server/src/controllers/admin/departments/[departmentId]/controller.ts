import { AdminOnly } from '@/server/src/auth/auth.decorators';
import { Bind, Controller, Delete, Patch } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { writeAdminAuditLog } from '@/server/src/infrastructure/write-admin-audit-log';
import { getCurrentAdmin } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

type Context = { params: Promise<{ departmentId: string }> };

@AdminOnly()
@Controller('admin/departments/:departmentId')
export class AdminDepartmentsDepartmentidController {
  @Patch()
  @Bind(WebRequest(), WebParams())
  async PATCH(request: Request, context: Context) {
    const admin = await getCurrentAdmin();
    if (!admin)
      return Response.json(
        { message: '管理者権限が必要です。' },
        { status: 403 },
      );
    const { departmentId } = await context.params;
    const body: unknown = await request.json().catch(() => null);
    const name =
      typeof body === 'object' &&
        body !== null &&
        'name' in body &&
        typeof body.name === 'string'
        ? body.name.trim()
        : '';
    if (!name || name.length > 80)
      return Response.json(
        { message: '部署名を1〜80文字で入力してください。' },
        { status: 400 },
      );
    const target = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true },
    });
    if (!target)
      return Response.json(
        { message: '部署が存在しません。' },
        { status: 404 },
      );
    const duplicate = await prisma.department.findFirst({
      where: { name, id: { not: departmentId } },
      select: { id: true },
    });
    if (duplicate)
      return Response.json(
        { message: '同じ部署名がすでに存在します。' },
        { status: 409 },
      );
    const department = await prisma.department.update({
      where: { id: departmentId },
      data: { name },
      select: { id: true, name: true },
    });
    await writeAdminAuditLog({
      action: 'DEPARTMENT_RENAMED',
      adminUserId: admin.id,
      targetUserId: departmentId,
      reason: `部署「${target.name}」を「${name}」へ変更`,
    });
    return Response.json({ message: '部署名を変更しました。', department });

  }

  @Delete()
  @Bind(WebRequest(), WebParams())
  async DELETE(_request: Request, context: Context) {
    const admin = await getCurrentAdmin();
    if (!admin)
      return Response.json(
        { message: '管理者権限が必要です。' },
        { status: 403 },
      );
    const { departmentId } = await context.params;
    const target = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { id: true, name: true, _count: { select: { members: true } } },
    });
    if (!target)
      return Response.json(
        { message: '部署が存在しません。' },
        { status: 404 },
      );
    if (target._count.members > 0)
      return Response.json(
        {
          message:
            '所属メンバーがいる部署は削除できません。先に所属を変更してください。',
        },
        { status: 409 },
      );
    await prisma.department.delete({ where: { id: departmentId } });
    await writeAdminAuditLog({
      action: 'DEPARTMENT_DELETED',
      adminUserId: admin.id,
      targetUserId: departmentId,
      reason: `部署「${target.name}」を削除`,
    });
    return Response.json({ message: '部署を削除しました。' });

  }
}
