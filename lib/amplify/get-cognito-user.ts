import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const region = userPoolId?.split('_')[0];

if (!region) throw new Error('Cognitoのリージョンを取得できませんでした。');

const cognitoClient = new CognitoIdentityProviderClient({ region });

export const getCognitoUser = async (accessToken: string) => {
  const result = await cognitoClient.send(
    new GetUserCommand({
      AccessToken: accessToken,
    }),
  );

  if (!result.UserAttributes) return;
  const attributes: Record<string, string> = {};

  result.UserAttributes.forEach(({ Name, Value }) => {
    if (Name && Value) attributes[Name] = Value;
  });

  return {
    sub: attributes.sub,
    email: attributes.email,
    name: attributes.name,
    emailVerified: attributes.email_verified === 'true',
  };
};
