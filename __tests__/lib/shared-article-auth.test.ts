import { NextRequest } from 'next/server';
import { expect, it, vi } from 'vitest';
const verify = vi.hoisted(() => vi.fn());
vi.mock('@/lib/AWS/cognito-verify-access-token', () => ({ verifyCognitoAccessToken: verify }));
import { proxy } from '@/proxy';
it('sends unauthenticated article readers to login with the original destination', async () => {
  const response = await proxy(new NextRequest('https://example.com/post/article-id'));
  const location = new URL(response.headers.get('location')!);
  expect(location.pathname).toBe('/login');
  expect(location.searchParams.get('next')).toBe('/post/article-id');
});
it('rejects an expired token and retains the article destination', async () => {
  verify.mockRejectedValueOnce(new Error('expired'));
  const response = await proxy(new NextRequest('https://example.com/post/article-id', { headers: { cookie: 'cognito_access_token=expired' } }));
  expect(new URL(response.headers.get('location')!).searchParams.get('next')).toBe('/post/article-id');
});
