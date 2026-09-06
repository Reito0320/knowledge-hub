import 'server-only';
import {
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';

const getCognitoSettings = () => {
  const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
  if (!userPoolId) throw new Error('Cognito User Poolが設定されていません。');

  const region = userPoolId.split('_')[0];
  if (!region) throw new Error('Cognitoのリージョンを取得できませんでした。');

  return { userPoolId, region };
};

/** Cognitoユーザーを有効化・無効化する。DBのUserと投稿は削除しない。 */
export const adminSetUserEnabled = async (
  userId: string,
  enabled: boolean,
) => {
  const { userPoolId, region } = getCognitoSettings();
  const client = new CognitoIdentityProviderClient({ region });
  const input = { UserPoolId: userPoolId, Username: userId };

  await client.send(
    enabled
      ? new AdminEnableUserCommand(input)
      : new AdminDisableUserCommand(input),
  );
};
