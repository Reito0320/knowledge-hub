import { setCookie } from './cookie';
import { encrypt } from './jwt';

export const createSession = async (userId: string) => {
  try {
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
