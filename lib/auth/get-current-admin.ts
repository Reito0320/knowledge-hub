import 'server-only';
import { getCookie } from '@/lib/cookie';
import { decrypt } from '@/lib/jwt';
import { prisma } from '@/lib/prisma';

/**
 * 自前Session JWTを検証し、DB上でもADMIN権限を持つユーザーか確認する。
 *
 * roleをJWTの中だけで判断すると、管理者権限を解除した後も
 * JWTの有効期限までは古い権限が残る可能性がある。
 * そのため、権限が必要な画面・APIではDBの最新roleを確認する。
 */
export const getCurrentAdmin = async () => {
  const sessionToken = await getCookie('session');
  if (!sessionToken) return null;

  try {
    const payload = await decrypt(sessionToken);
    if (!payload || typeof payload.userId !== 'string') return null;

    const admin = await prisma.user.findFirst({
      where: {
        id: payload.userId,
        role: 'ADMIN',
      },
      select: {
        id: true,
      },
    });

    return admin;
  } catch {
    return null;
  }
};
