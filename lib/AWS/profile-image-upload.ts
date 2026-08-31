export const profileImageContentTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

/* 先に用意した配列の要素の中でunion型を作成している。メリットとして、上の配列に要素を増やせば値の候補が自動で増える */
export type ProfileImageContentType = (typeof profileImageContentTypes)[number];

export const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * 引数にcontent-typeを取り、文字列か、用意した候補の中の文字列と一緒かを精査してbooleanの値を返す。
 * @param value
 * @returns
 */
export const isProfileImageContentType = (
  value: unknown,
): value is ProfileImageContentType =>
  typeof value === 'string' &&
  profileImageContentTypes.some((contentType) => contentType === value);

/**
 * content-typeと一致するものに拡張子としての文字列を返す関数
 * @param contentType
 * @returns
 */
export const getProfileImageExtension = (
  contentType: ProfileImageContentType,
): string => {
  if (contentType === 'image/jpeg') return 'jpg';
  if (contentType === 'image/png') return 'png';
  return 'webp';
};
