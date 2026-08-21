import { confirmSignUp } from 'aws-amplify/auth';

export const getEmail = (searchParams: string | null) => {
  if (searchParams) return searchParams;
  if (typeof window === 'undefined') return '';

  return sessionStorage.getItem('signupEmail') ?? '';
};

export const getErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return '確認処理に失敗しました。もう一度お試しください。';
  }

  switch (error.name) {
    case 'CodeMismatchException':
      return '確認コードが正しくありません。';
    case 'ExpiredCodeException':
      return '確認コードの有効期限が切れています。コードを再送してください。';
    case 'LimitExceededException':
      return '試行回数の上限に達しました。しばらく待ってからお試しください。';
    case 'UserNotFoundException':
      return '登録情報が見つかりません。新規登録からやり直してください。';
    default:
      return '確認処理に失敗しました。もう一度お試しください。';
  }
};

export const cognitoConfirm = async (email: string, code: string) => {
  const result = await confirmSignUp({
    username: email,
    confirmationCode: code.trim(),
  });

  /* ここでDBにuserのデータを保存するfetchが走る */
  return result;
};
