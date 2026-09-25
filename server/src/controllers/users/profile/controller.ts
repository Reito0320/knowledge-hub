import { Bind, Controller, Patch } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { getCurrentUser } from '@/server/src/auth/request-user';
import { createProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';
import { prisma } from '@/server/src/infrastructure/prisma';

@Controller('users/profile')
export class UsersProfileController {
  @Patch()
  @Bind(WebRequest(), WebParams())
  async PATCH(request: Request) {
    const userId = await getCurrentUser();
    if (!userId)
      return Response.json(
        { message: 'ログインが必要です。' },
        { status: 401 },
      );

    const body: unknown = await request.json();
    const departmentId =
      typeof body === 'object' && body && 'departmentId' in body
        ? body.departmentId
        : null;
    const name =
      typeof body === 'object' &&
        body &&
        'name' in body &&
        typeof body.name === 'string'
        ? body.name.trim()
        : '';
    const jobTitle =
      typeof body === 'object' &&
        body &&
        'jobTitle' in body &&
        typeof body.jobTitle === 'string'
        ? body.jobTitle.trim()
        : '';
    const bio =
      typeof body === 'object' &&
        body &&
        'bio' in body &&
        typeof body.bio === 'string'
        ? body.bio.trim()
        : '';

    if (!name || name.length > 50)
      return Response.json(
        { message: '表示名は1〜50文字で入力してください。' },
        { status: 400 },
      );
    if (jobTitle.length > 80 || bio.length > 500)
      return Response.json(
        { message: '役職または自己紹介が長すぎます。' },
        { status: 400 },
      );

    if (departmentId !== null && typeof departmentId !== 'string')
      return Response.json(
        { message: '部署が正しくありません。' },
        { status: 400 },
      );

    if (departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: departmentId },
        select: { id: true },
      });
      if (!department)
        return Response.json(
          { message: '部署が見つかりません。' },
          { status: 400 },
        );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        jobTitle: jobTitle || null,
        bio: bio || null,
        departmentId: departmentId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        photoObjectKey: true,
        jobTitle: true,
        bio: true,
        department: { select: { id: true, name: true } },
      },
    });

    let photoUrl: string | null = null;

    if (user.photoObjectKey) {
      photoUrl = await createProfileImageViewUrl(user.photoObjectKey);
    }

    return Response.json({
      message: 'プロフィールを更新しました。',
      user: {
        ...user,
        photoObjectKey: undefined,
        photoUrl,
      },
    });

  }
}
