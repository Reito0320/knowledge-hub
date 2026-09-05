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

  /*
   * TODO(session-revocation): JWTへsessionVersionを追加した後は、payloadの型を確認し、
   * DBのUser.sessionVersionと一致しなければnullを返す。GET /api/auth/sessionや
   * getCurrentAdminでも同じ検証が必要なので、最終的にはverifyAppSession()のような
   * Server専用共通関数へまとめ、すべての認証入口から呼び出す。
   */
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
