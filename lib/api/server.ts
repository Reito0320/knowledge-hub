import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COGNITO_ACCESS_TOKEN_COOKIE } from '@/lib/auth/constants';
import { getApiOrigin } from './origin';

/** Server Components forward only the session credential. Data and authorization live in NestJS. */
export async function fetchServerApi<T>(path: string, params: Record<string, string | string[] | undefined> = {}): Promise<T> {
  const url = new URL(`${getApiOrigin()}/api${path}`);
  for (const [key, value] of Object.entries(params)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) url.searchParams.set(key, first);
  }
  const token = (await cookies()).get(COGNITO_ACCESS_TOKEN_COOKIE)?.value;
  const response = await fetch(url, {
    headers: token ? { cookie: `${COGNITO_ACCESS_TOKEN_COOKIE}=${encodeURIComponent(token)}` } : {},
    cache: 'no-store', redirect: 'manual', signal: AbortSignal.timeout(15_000),
  });
  if (response.status === 401) redirect('/login');
  if (response.status === 403) redirect(path.startsWith('/admin/') ? '/' : '/login');
  if (!response.ok) throw new Error(`API のデータを取得できませんでした (${response.status})`);
  return response.json() as Promise<T>;
}
