import { signUp } from 'aws-amplify/auth';

export const handleSignup = async (
  name: string,
  email: string,
  password: string,
  departmentId: string,
): Promise<void> => {
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
};

export const getSignupErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) return '新規登録に失敗しました。もう一度お試しください。';

  switch (error.name) {
    case 'UsernameExistsException':
      return 'このメールアドレスは登録済みです。ログインしてください。';
    case 'InvalidPasswordException':
      return 'パスワードの条件を満たしていません。';
    case 'LimitExceededException':
    case 'TooManyRequestsException':
      return '操作が集中しています。しばらく待ってからお試しください。';
    case 'CodeDeliveryFailureException':
      return '確認コードを送信できませんでした。時間をおいてお試しください。';
    default:
      return '新規登録に失敗しました。入力内容を確認してください。';
  }
};
