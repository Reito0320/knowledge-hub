import { fetchPostCreateSession } from '@/app/api/auth/session/fetch';
import { fetchAuthSession } from 'aws-amplify/auth';

/**
 * cognitoのtokenと自前のtokenを同期させる関数
 * @returns -boolean
 */
export const restoreAppSession = async () => {
  /* cognitoのsessionを取得 */
  const authSession = await fetchAuthSession();
  const accessToken = authSession.tokens?.accessToken?.toString();

  if (!accessToken) return false;

  const message = await fetchPostCreateSession('Bearer ' + accessToken);
  console.log('message', message);
  return true;
};
