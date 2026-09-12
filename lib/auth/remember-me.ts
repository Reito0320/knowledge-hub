import { cognitoUserPoolsTokenProvider } from 'aws-amplify/auth/cognito';
import { defaultStorage, sessionStorage } from 'aws-amplify/utils';

const preferenceKey = 'auth:remember-me';
export const isLoginRemembered = () =>
  typeof window !== 'undefined' && window.localStorage.getItem(preferenceKey) === 'true';

export const configureAuthStorage = () => {
  cognitoUserPoolsTokenProvider.setKeyValueStorage(isLoginRemembered() ? defaultStorage : sessionStorage);
};

export const setLoginRemembered = (remember: boolean) => {
  // 別の保存先に古い認証情報を残さない。アプリの下書きなどは維持する。
  const prefix = `CognitoIdentityServiceProvider.${process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID}.`;
  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of Object.keys(storage)) {
      if (key.startsWith(prefix)) storage.removeItem(key);
    }
  }
  window.localStorage.setItem(preferenceKey, String(remember));
  configureAuthStorage();
};
