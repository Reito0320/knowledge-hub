import { signUp } from 'aws-amplify/auth';

export const handleSignup = async (
  name: string,
  email: string,
  password: string,
): Promise<boolean> => {
  try {
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });

    sessionStorage.setItem('signupEmail', email);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
