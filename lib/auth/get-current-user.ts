import 'server-only';
import { prisma } from '../prisma';
import { getVerifiedCognitoSession } from './cognito-session';

/**
 * Cognito Access Tokenを検証し、subからアプリのUserを取得する。
 * @returns
 */
export const getCurrentUser = async () => {
  const session = await getVerifiedCognitoSession();
  if (!session) return;

  const id = session.payload.sub;
  const user = await prisma.user.findFirst({
    where: {
      id: id,
      status: 'ACTIVE',
    },
    select: {
      id: true,
    },
  });
  return user?.id;
};
