import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ cookie: vi.fn(), redirect: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: mocks.cookie }) }));
vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
import { fetchServerApi } from '@/lib/api/server';
beforeEach(() => { vi.clearAllMocks(); mocks.cookie.mockReturnValue({ value: 'token' }); mocks.redirect.mockImplementation((path) => { throw new Error(`redirect:${path}`); }); });
afterEach(() => vi.unstubAllGlobals());
it('forwards only the session cookie, no-store and query values to NestJS', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ members: [] }) });
  vi.stubGlobal('fetch', fetch);
  expect(await fetchServerApi('/search', { member: ['Alice', 'Bob'], page: '2' })).toEqual({ members: [] });
  const [url, options] = fetch.mock.calls[0];
  expect(url.pathname).toBe('/api/search');
  expect(url.searchParams.get('member')).toBe('Alice');
  expect(options).toMatchObject({ cache: 'no-store', redirect: 'manual', headers: { cookie: 'cognito_access_token=token' } });
});
it.each([[401, '/home', '/login'], [403, '/admin/dashboard', '/']] as const)('handles authorization failure %i', async (status, path, target) => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status }));
  await expect(fetchServerApi(path)).rejects.toThrow(`redirect:${target}`);
});
it('surfaces a backend outage instead of presenting an empty successful page', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
  await expect(fetchServerApi('/home')).rejects.toThrow('503');
  expect(mocks.redirect).not.toHaveBeenCalled();
});
