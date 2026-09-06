import 'server-only';
import { getCognitoUser } from '@/lib/AWS/get-cognito-user';
import { verifyCognitoAccessToken } from '@/lib/AWS/cognito-verify-access-token';
import { COGNITO_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { getCookie } from '@/lib/cookie';

export { COGNITO_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';

/**
 * Cognito Access Tokenを検証する。
 * JWTの署名・期限だけでなくGetUserも呼び、Cognitoで無効化・削除・
 * Global sign-outされたユーザーのTokenを受け付けない。
 */
export const verifyActiveCognitoAccessToken = async (accessToken: string) => {
  try {
    const [payload, cognitoUser] = await Promise.all([
      verifyCognitoAccessToken(accessToken),
      getCognitoUser(accessToken),
    ]);

    if (!payload.sub || payload.sub !== cognitoUser?.sub) return null;

    return { accessToken, payload, cognitoUser };
  } catch {
    return null;
  }
};

/** Cookieに保存したCognito Access Tokenを検証する。 */
export const getVerifiedCognitoSession = async () => {
  const accessToken = await getCookie(COGNITO_ACCESS_TOKEN_COOKIE);
  if (!accessToken) return null;

  return verifyActiveCognitoAccessToken(accessToken);
};
