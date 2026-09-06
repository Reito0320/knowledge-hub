import 'server-only';
import {
  AdminUserGlobalSignOutCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

/** 対象ユーザーについてCognitoが発行したTokenをまとめて失効させる。 */
export const adminUserGlobalSignOut = async (userId: string) => {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  if (!userPoolId) throw new Error('Cognito User Poolが設定されていません。');

  const region = userPoolId.split('_')[0];
  if (!region) throw new Error('Cognitoのリージョンを取得できませんでした。');

  const client = new CognitoIdentityProviderClient({ region });
  await client.send(
    new AdminUserGlobalSignOutCommand({
      UserPoolId: userPoolId,
      Username: userId,
    }),
  );
};
