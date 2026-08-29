import { jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

const getSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRETが設定されていません。');
  return new TextEncoder().encode(secret);
};

/**
 * 保護対象ページへ入る前に、自前Session JWTを軽量に検証する。
 * ここではDBへ接続しない。各API・Server Actionは改めて認証と認可を行う。
 */
export const proxy = async (request: NextRequest) => {
  const sessionToken = request.cookies.get('session')?.value;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set(
    'next',
    request.nextUrl.pathname + request.nextUrl.search,
  );

  if (!sessionToken) return NextResponse.redirect(loginUrl);

  try {
    const { payload } = await jwtVerify(sessionToken, getSecretKey(), {
      algorithms: ['HS256'],
    });
    if (typeof payload.userId !== 'string') throw new Error('userIdなし');
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('session');
    return response;
  }
};

export const config = {
  matcher: ['/', '/post/:path*', '/bookmarks/:path*', '/activity/:path*'],
};
