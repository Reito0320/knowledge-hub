/* 自前のsession発行用のファイル */
import { jwtVerify, SignJWT } from 'jose';
import { env } from '../config/env.ts';

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export const createSessionToken = (userId: string) =>
  new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);

/**
 * accessしているTokenを使って、envのJWT_SECRET（複合鍵）でtoken検証して、データが正常にあったらuserIdを返す
 * @param sessionToken
 * @returns
 */
export const verifySessionToken = async (sessionToken: string) => {
  /* joseライブラリのjwtVerifyでaccessTokenとsecretKeyで検証 */
  /* createSessionで"HS256"の暗号化方式をとっているので、同じものを指定 */
  const { payload } = await jwtVerify(sessionToken, secretKey, {
    algorithms: ['HS256'],
  });
  if (typeof payload.userId !== 'string')
    throw new Error('sessionにuserのデータがありません。');

  return payload.userId;
};
