import { setCookie } from './cookie';
import { encrypt } from './jwt';

/**
 * 自前のtoken発行関数
 * @param userId
 * @returns
 */
export const createSession = async (userId: string) => {
  try {
    /*
     * TODO(session-revocation): UserへsessionVersionを追加した後は、ここでDBから
     * `{ id, sessionVersion }`を取得し、JWTへ`userId`と`sessionVersion`を両方入れる。
     * Cookieに保存するJWT文字列自体をDBへ保存する必要はない。
     *
     * 例: encrypt({ userId, sessionVersion: user.sessionVersion, expiresAt })
     */
    /* sessionの期限設定 */
    const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
    /* sessionの期限と共に、userIdをjwt文字列に変換 */
    const session = await encrypt({ userId, expiresAt });

    await setCookie('session', session);
    return;
  } catch (error) {
    console.error(error);
    throw new Error('createSession error');
  }
};
