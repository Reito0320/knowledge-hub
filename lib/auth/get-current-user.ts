import 'server-only';
import { getCookie } from '../cookie';
import { decrypt } from '../jwt';
import { prisma } from '../prisma';

/**
 * 自前sessionが存在していたらpayloadを取得、その後payloadの情報からuserのデータを取得
 * @returns
 */
export const getCurrentUser = async () => {
  const session = await getCookie('session');
  const payload = await decrypt(session);
  if (!payload || typeof payload.userId !== 'string') return;
  const id = payload.userId;
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
