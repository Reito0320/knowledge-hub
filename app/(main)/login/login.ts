import { signIn } from 'aws-amplify/auth';

export const handleSignIn = async (e: React.SubmitEvent<HTMLFormElement>) => {
  try {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { isSignedIn, nextStep } = await signIn({ username, password });
    console.log('isSignedIn', isSignedIn);
    console.log('nextStep', nextStep);

    // 1. 通常のログイン成功
    if (isSignedIn) return;

    // 2. 追加の認証ステップが必要な場合（条件分岐）
    switch (nextStep.signInStep) {
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
        console.log('初回ログインのため、新しいパスワードの設定が必要です。');
        // パスワード変更画面へ遷移させる
        break;
      case 'CONFIRM_SIGN_UP':
        console.log('サインアップの確認（メール認証）が完了していません。');
        // 前述の確認コード入力画面へ遷移させる
        break;
      default:
        console.log('その他のステップ:', nextStep.signInStep);
    }
  } catch (error) {
    console.error('ログインに失敗しました:', error);
    // error.name で 'UserNotConfirmedException' などをキャッチして個別に処理も可能
  }
};
