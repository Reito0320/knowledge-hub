export const fetchPostCreateUser = async (header: string) => {
  const res = await fetch('/api/users/provision', {
    method: 'POST',
    headers: {
      Authorization: 'Bearer' + header,
    },
  });
  if (!res.ok)
    throw new Error('userの情報をdbに保存する通信が失敗しています。');

  const { message } = await res.json();
  return message;
};
