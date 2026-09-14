/** 同一サイト内のパスだけを認証後の遷移先として許可する。 */
export const safeReturnPath = (value: string | null) => {
  if (!value?.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020]/.test(value)) return '/';
  return value;
};
export const returnPathFromSearch = (search: string) => safeReturnPath(new URLSearchParams(search).get('next'));
export const authHref = (path: string, next: string) => `${path}${path.includes('?') ? '&' : '?'}next=${encodeURIComponent(next)}`;
