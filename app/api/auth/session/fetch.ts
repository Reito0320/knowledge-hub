import { readJsonResponse } from '@/lib/http/read-json-response';

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
  jobTitle: string | null;
  bio: string | null;
  role: 'MEMBER' | 'ADMIN';
  status: 'PENDING' | 'ACTIVE' | 'SUSPENDED';
  department: { id: string; name: string } | null;
};

/**
 * Cognitoセッションからuserのデータを取得する関数
 * @returns
 */
export const fetchGetSession = async () => {
  const res = await fetch('/api/auth/session', {
    method: 'GET',
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const { user } = await readJsonResponse<{ user: SessionUser }>(res);
  return user;
};

/**
 * Cognito Access TokenをServer用のHttpOnly Cookieへ保存する。
 * @param header
 * @returns
 */
export const fetchPostCreateSession = async (header: string) => {
  const res = await fetch('/api/auth/session', {
    method: 'POST',
    headers: {
      Authorization: header,
    },
  });
  const { message } = await readJsonResponse<{ message: string }>(res);

  if (!res.ok) throw new Error(message);

  return message;
};

export const fetchDeleteSession = async () => {
  const res = await fetch('/api/auth/session', {
    method: 'DELETE',
  });
  const { message } = await readJsonResponse<{ message: string }>(res);

  if (!res.ok) throw new Error(message);
  return message;
};
