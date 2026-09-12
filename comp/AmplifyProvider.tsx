'use client';

import '@/lib/AWS/cognito';
import { restoreAppSession } from '@/lib/auth/restore';
import { useEffect } from 'react';

const AmplifyProvider = ({ children }: { children: React.ReactNode }) => {
  useEffect(() => {
    let disposed = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;

    const syncCognitoToken = async (forceRefresh = false) => {
      if (refreshTimer) clearTimeout(refreshTimer);
      try {
        // fetchAuthSessionは必要に応じてAmplify側でTokenを更新する。
        const expiresAt = await restoreAppSession(forceRefresh);
        if (disposed || !expiresAt) return;

        // Access Token失効の1分前にHttpOnly Cookieも更新する。
        const refreshDelay = Math.max(
          30_000,
          expiresAt * 1000 - Date.now() - 60_000,
        );
        refreshTimer = setTimeout(() => void syncCognitoToken(true), refreshDelay);

        // 期限切れCookieでloginへ戻された場合は、AmplifyのRefresh Tokenで復帰する。
        if (window.location.pathname === '/login') {
          const requestedPath = new URLSearchParams(window.location.search).get(
            'next',
          );
          const safePath =
            requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
              ? requestedPath
              : '/';
          window.location.replace(safePath);
        }
      } catch {
        // 未ログイン、Cognito無効化、Token失効時はログイン画面に留める。
      }
    };

    const onFocus = () => void syncCognitoToken();
    window.addEventListener('focus', onFocus);
    void syncCognitoToken();

    return () => {
      disposed = true;
      window.removeEventListener('focus', onFocus);
      if (refreshTimer) clearTimeout(refreshTimer);
    };
  }, []);

  return <>{children}</>;
};

export default AmplifyProvider;
