import { fetchPostCreateSession } from '@/app/api/auth/session/fetch';
import { fetchPostCreateUser } from '@/app/api/users/provision/fetch';
import { fetchAuthSession, signIn } from 'aws-amplify/auth';

/**
 * イベントを引数にとって,すでに存在しているcognitoのtokenを取得。取得できなかったら未ログインのuserとみなして、login処理をして、cognitoのtokenを発行
 * @param e
 * @returns
 */
export const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const username = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    /* これでcognito側で発行したtokenを取得できる */
    let authSession = await fetchAuthSession();
    let accessToken = authSession.tokens?.accessToken?.toString();
    /* すでにアカウント作成をしているけれどtokenが失効している場合にcognitoのlogin処置が走る */
    if (!accessToken) {
      const { isSignedIn } = await signIn({ username, password });

      if (!isSignedIn) return false;

      authSession = await fetchAuthSession();
      accessToken = authSession.tokens?.accessToken?.toString();
    }

    /* 未ログインだったので、再度login処理を実行し、取得しなおしたtokenすらも取得できなかった場合 */
    if (!accessToken) throw new Error('access tokenを取得できません');

    const departmentId = sessionStorage.getItem('signupDepartmentId');
    await fetchPostCreateUser(accessToken, departmentId);
    sessionStorage.removeItem('signupDepartmentId');

    /* ここでtokenの認証を行うための通信を実行 */
    await fetchPostCreateSession(`Bearer ${accessToken}`);

    return true;
  } catch (error) {
    console.error('ログインに失敗しました:', error);
    throw error;
  }
};
