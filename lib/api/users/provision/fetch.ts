import { readJsonResponse } from '@/lib/http/read-json-response';

export const fetchPostCreateUser = async (
  accessToken: string,
  departmentId?: string | null,
) => {
  const res = await fetch('/api/users/provision', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + accessToken,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ departmentId: departmentId || null }),
  });
  const { message } = await readJsonResponse<{ message: string }>(res);

  if (!res.ok) throw new Error(message);

  return message;
};
