import { CognitoJwtVerifier } from 'aws-jwt-verify';

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!;
const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID;

if (!userPoolId || !clientId) {
  throw new Error('環境設定がされていないです');
}

/* cognito側でJWT認証をしてくれる */
const verifier = CognitoJwtVerifier.create({
  userPoolId,
  clientId,
  tokenUse: 'access',
});

/**
 * cognitoのtokenを検証し,正常であればpayloadを返す関数
 * @param token
 * @returns
 */
export const verifyCognitoAccessToken = async (token: string) =>
  verifier.verify(token);
