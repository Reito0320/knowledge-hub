import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../config/env.js';

const region = env.COGNITO_USER_POOL_ID.split('_')[0];

if (!region) {
  throw new Error('Cognito User Pool IDからリージョンを取得できませんでした。');
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: env.COGNITO_USER_POOL_ID,
  clientId: env.COGNITO_CLIENT_ID,
  tokenUse: 'access',
});

const cognitoClient = new CognitoIdentityProviderClient({ region });

export const verifyCognitoAccessToken = (token: string) =>
  verifier.verify(token);

export const getCognitoUser = async (accessToken: string) => {
  const result = await cognitoClient.send(
    new GetUserCommand({ AccessToken: accessToken }),
  );

  const attributes: Record<string, string> = {};

  result.UserAttributes?.forEach(({ Name, Value }) => {
    if (Name && Value) attributes[Name] = Value;
  });

  return {
    sub: attributes.sub,
    email: attributes.email,
    name: attributes.name,
    emailVerified: attributes.email_verified === 'true',
  };
};
