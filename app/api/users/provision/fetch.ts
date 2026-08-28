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
  if (!res.ok)
    throw new Error('userの情報をdbに保存する通信が失敗しています。');

  const { message } = await res.json();
  return message;
};
