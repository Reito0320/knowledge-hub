import { fetchPostCreateSession } from '@/app/api/auth/session/fetch';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * Amplifyが更新したCognito TokenをHttpOnly Cookieへ同期させる関数。
 * @returns -boolean
 */
export const restoreAppSession = async () => {
  /* cognitoのsessionを取得 */
  const authSession = await fetchAuthSession();
  const accessToken = authSession.tokens?.accessToken?.toString();

  if (!accessToken) return null;

  await fetchPostCreateSession('Bearer ' + accessToken);
  return typeof authSession.tokens?.accessToken.payload.exp === 'number'
    ? authSession.tokens.accessToken.payload.exp
    : null;
};
