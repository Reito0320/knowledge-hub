import 'server-only';
import {
  AdminDeleteSoftwareTokenCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

/**
 * 管理者権限で対象ユーザーのTOTP登録をCognitoから削除する。
 * AWS認証情報はブラウザへ渡さず、AmplifyのCompute roleから取得する。
 */
export const adminDeleteSoftwareToken = async (userId: string) => {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  if (!userPoolId) {
    throw new Error('Cognito User Poolが設定されていません。');
  }

  const region = userPoolId.split('_')[0];
  if (!region) {
    throw new Error('Cognitoのリージョンを取得できませんでした。');
  }

  const cognitoClient = new CognitoIdentityProviderClient({ region });
  const command = new AdminDeleteSoftwareTokenCommand({
    UserPoolId: userPoolId,
    // User.idにはCognitoのsubを保存しているため、そのままUsernameへ渡せる。
    Username: userId,
  });

  await cognitoClient.send(command);
};
