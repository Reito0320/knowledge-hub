import { signUp } from 'aws-amplify/auth';

export const handleSignup = async (
  name: string,
  email: string,
  password: string,
  departmentId: string,
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

    if (departmentId) {
      sessionStorage.setItem('signupDepartmentId', departmentId);
    } else {
      sessionStorage.removeItem('signupDepartmentId');
    }

    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};
