import 'dotenv/config';

const requiredEnv = (name: string) => {
  const value = process.env[name];

  if (!value) throw new Error(`${name}が設定されていません。`);

  return value;
};

const jwtSecret = requiredEnv('JWT_SECRET');

if (jwtSecret.length < 32) {
  throw new Error('JWT_SECRETは32文字以上で設定してください。');
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  PORT: Number(process.env.PORT ?? 3001),
  CLIENT_ORIGIN: requiredEnv('CLIENT_ORIGIN'),
  COGNITO_USER_POOL_ID: requiredEnv('COGNITO_USER_POOL_ID'),
  COGNITO_CLIENT_ID: requiredEnv('COGNITO_CLIENT_ID'),
  DATABASE_URL: requiredEnv('DATABASE_URL'),
  JWT_SECRET: jwtSecret,
};
