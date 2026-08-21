import { signUp } from 'aws-amplify/auth';

export const handleSignup = async (
  name: string,
  email: string,
  password: string,
): Promise<boolean> => {
  try {
    const signupRes = await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
    console.log('signupRes', signupRes);
    /* ここのsignupResでDBにメール認証の状態をpendingでuserを作成する */

    sessionStorage.setItem('signupEmail', email);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
