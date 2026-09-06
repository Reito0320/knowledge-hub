import { verifyCognitoAccessToken } from '@/lib/AWS/cognito-verify-access-token';
import { COGNITO_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { NextRequest, NextResponse } from 'next/server';

/**
 * 保護対象ページへ入る前にCognito Access Tokenを軽量に検証する。
 * ここではDBへ接続しない。各API・Server Actionは改めて認証と認可を行う。
 */
export const proxy = async (request: NextRequest) => {
  const accessToken = request.cookies.get(COGNITO_ACCESS_TOKEN_COOKIE)?.value;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set(
    'next',
    request.nextUrl.pathname + request.nextUrl.search,
  );

  if (!accessToken) return NextResponse.redirect(loginUrl);

  try {
    await verifyCognitoAccessToken(accessToken);
    return NextResponse.next();
  } catch {
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(COGNITO_ACCESS_TOKEN_COOKIE);
    return response;
  }
};

export const config = {
  matcher: [
    '/',
    '/post/:path*',
    '/bookmarks/:path*',
    '/activity/:path*',
    '/admin/:path*',
  ],
};
