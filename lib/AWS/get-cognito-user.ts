/* 使いまわせるファイル */

import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const userPoolId = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID;
const region = userPoolId?.split('_')[0];

if (!region) throw new Error('Cognitoのリージョンを取得できませんでした。');

const cognitoClient = new CognitoIdentityProviderClient({ region });

/**
 * cognitoのtokenを使ってcognito側で登録されているuserのデータを取得して返す関数
 * @param accessToken
 * @returns
 */
export const getCognitoUser = async (accessToken: string) => {
  const result = await cognitoClient.send(
    new GetUserCommand({
      AccessToken: accessToken,
    }),
  );

  if (!result.UserAttributes) return;
  const attributes: Record<string, string> = {};

  result.UserAttributes.forEach((attribute) => {
    /* Cognitoから返された属性名と属性値を取り出す */
    const attributeName = attribute.Name;
    const attributeValue = attribute.Value;

    /* 属性名または属性値が存在しないデータは保存しない */
    if (!attributeName || !attributeValue) return;

    /* emailやnameなどの属性名をkeyにして、その値を保存する */
    attributes[attributeName] = attributeValue;
  });

  return {
    sub: attributes.sub,
    email: attributes.email,
    name: attributes.name,
    emailVerified: attributes.email_verified === 'true',
  };
};
