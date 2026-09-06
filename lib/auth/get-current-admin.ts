import 'server-only';
import { prisma } from '@/lib/prisma';
import { getVerifiedCognitoSession } from '@/lib/auth/cognito-session';

/**
 * Cognito Access Tokenを検証し、DB上でもADMIN権限を持つユーザーか確認する。
 *
 * roleをCognito Tokenだけで判断すると、DBで管理者権限を解除した後も
 * Tokenの有効期限までは古い権限が残る可能性がある。
 * そのため、権限が必要な画面・APIではDBの最新roleを確認する。
 */
export const getCurrentAdmin = async () => {
  const session = await getVerifiedCognitoSession();
  if (!session) return null;

  try {
    const admin = await prisma.user.findFirst({
      where: {
        id: session.payload.sub,
        role: 'ADMIN',
        status: 'ACTIVE',
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
