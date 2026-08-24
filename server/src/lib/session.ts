import { SignJWT } from 'jose';
import { env } from '../config/env.js';

const secretKey = new TextEncoder().encode(env.JWT_SECRET);

export const createSessionToken = (userId: string) =>
  new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secretKey);
