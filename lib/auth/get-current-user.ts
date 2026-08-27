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
  if (!session) return null;

  const payload = await decrypt(session);
  console.log('payload', payload);
  if (!payload) return null;

  // const user = await prisma.user.findUnique({
  //   where
  // })
};
