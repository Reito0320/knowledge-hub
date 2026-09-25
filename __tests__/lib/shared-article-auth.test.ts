import { NextRequest } from 'next/server';
import { afterEach, expect, it, vi } from 'vitest';
import { proxy } from '@/proxy';

afterEach(() => vi.unstubAllGlobals());
it('sends unauthenticated article readers to login with the original destination', async () => {
  const fetch = vi.fn();
  vi.stubGlobal('fetch', fetch);
  const response = await proxy(new NextRequest('https://example.com/post/article-id'));
  const location = new URL(response.headers.get('location')!);
  expect(location.pathname).toBe('/login');
  expect(location.searchParams.get('next')).toBe('/post/article-id');
  expect(fetch).not.toHaveBeenCalled();
});
it('delegates token validation to NestJS and preserves the article destination on rejection', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: false, status: 401 });
  vi.stubGlobal('fetch', fetch);
  const response = await proxy(new NextRequest('https://example.com/post/article-id', { headers: { cookie: 'cognito_access_token=expired' } }));
  expect(new URL(response.headers.get('location')!).searchParams.get('next')).toBe('/post/article-id');
  expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/api/auth/check'), expect.objectContaining({ cache: 'no-store', headers: { cookie: 'cognito_access_token=expired' } }));
});
it('allows a session approved by NestJS', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
  expect((await proxy(new NextRequest('https://example.com/post/article-id', { headers: { cookie: 'cognito_access_token=valid' } }))).status).toBe(200);
});
it('returns 503 without deleting the session during an API outage', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
  const response = await proxy(new NextRequest('https://example.com/post/article-id', { headers: { cookie: 'cognito_access_token=valid' } }));
  expect(response.status).toBe(503);
  expect(response.headers.get('set-cookie')).toBeNull();
});
