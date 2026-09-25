import { COGNITO_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { getApiOrigin } from '@/lib/api/origin';
import { NextRequest, NextResponse } from 'next/server';

/** Page navigation delegates authentication to NestJS; API routes enforce their own Guard. */
export const proxy = async (request: NextRequest) => {
  const token = request.cookies.get(COGNITO_ACCESS_TOKEN_COOKIE)?.value;
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
  if (!token) return NextResponse.redirect(loginUrl);
  try {
    const response = await fetch(`${getApiOrigin()}/api/auth/check`, {
      headers: { cookie: `${COGNITO_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}` },
      cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return NextResponse.next();
    if (response.status === 401 || response.status === 403) {
      const redirect = NextResponse.redirect(loginUrl);
      redirect.cookies.delete(COGNITO_ACCESS_TOKEN_COOKIE);
      return redirect;
    }
  } catch { /* Preserve the cookie during a temporary backend outage. */ }
  return NextResponse.json({ message: '認証サービスに接続できません。時間をおいて再度お試しください。' }, { status: 503 });
};

export const config = {
  matcher: ['/', '/post/:path*', '/bookmarks/:path*', '/activity/:path*', '/admin/:path*', '/search/:path*'],
};
