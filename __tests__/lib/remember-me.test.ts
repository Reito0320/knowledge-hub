// @vitest-environment jsdom
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ setStorage: vi.fn(), persistent: {}, temporary: {} }));
vi.mock('aws-amplify/auth/cognito', () => ({ cognitoUserPoolsTokenProvider: { setKeyValueStorage: mocks.setStorage } }));
vi.mock('aws-amplify/utils', () => ({ defaultStorage: mocks.persistent, sessionStorage: mocks.temporary }));
import { configureAuthStorage, setLoginRemembered, isLoginRemembered } from '@/lib/auth/remember-me';
beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
it('defaults to temporary storage and restores the remembered choice after reload', () => {
  configureAuthStorage();
  expect(mocks.setStorage).toHaveBeenLastCalledWith(mocks.temporary);
  setLoginRemembered(true);
  expect(isLoginRemembered()).toBe(true);
  configureAuthStorage();
  expect(mocks.setStorage).toHaveBeenLastCalledWith(mocks.persistent);
});
it('removes old Cognito tokens from both stores while preserving drafts', () => {
  const key = `CognitoIdentityServiceProvider.${process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID}.user.refreshToken`;
  localStorage.setItem(key, 'old-token');
  sessionStorage.setItem(key, 'old-token');
  localStorage.setItem('post-draft:new', 'draft');
  setLoginRemembered(false);
  expect(localStorage.getItem(key)).toBeNull();
  expect(sessionStorage.getItem(key)).toBeNull();
  expect(localStorage.getItem('post-draft:new')).toBe('draft');
  expect(mocks.setStorage).toHaveBeenLastCalledWith(mocks.temporary);
});
