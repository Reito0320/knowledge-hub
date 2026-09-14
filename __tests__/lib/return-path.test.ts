import { expect, it } from 'vitest';
import { authHref, returnPathFromSearch, safeReturnPath } from '@/lib/auth/return-path';
it('preserves article destination through registration and confirmation', () => {
  const article = '/post/123?from=share';
  const signup = authHref('/signup', article);
  const confirm = authHref('/confirm', returnPathFromSearch(new URL(signup, 'https://example.com').search));
  const login = authHref('/login?confirmed=1', returnPathFromSearch(new URL(confirm, 'https://example.com').search));
  expect(returnPathFromSearch(new URL(login, 'https://example.com').search)).toBe(article);
});
it('rejects external and backslash redirect targets', () => {
  for (const target of ['https://evil.com', '//evil.com', '/\\evil.com', '/\nevil.com', null]) expect(safeReturnPath(target)).toBe('/');
});
