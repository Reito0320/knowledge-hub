import { JWTPayload, jwtVerify, SignJWT } from 'jose';

/* 全ての基盤となるsecretKeyを取得 */
const secretKey = process.env.JWT_SECRET as string;

/* 暗号化しやすいようにUint8Arrayの形に変換 */
const encodeKey = new TextEncoder().encode(secretKey);

/**
 * @param payload
 * @returns
 * payload を使って、HS256方式で、
 * 発行時間と有効期限付きのJWTを作成し、
 * 秘密鍵で署名して返す関数
 */
export const encrypt = async (payload: JWTPayload) => {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('6h')
    .sign(encodeKey);
};

/**
 * @param session
 * @returns
 * JWT文字列(session) を検証して、中に入っている payload を取り出す関数
 */
export const decrypt = async (session: string | undefined = '') => {
  try {
    if (!session) return null;

    const { payload } = await jwtVerify(session, encodeKey, {
      algorithms: ['HS256'],
    });

    return payload;
  } catch (error) {
    console.error(error);
    throw new Error('decrypt error');
  }
};
