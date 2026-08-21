export const fetchPostCreateSession = async (header: string) => {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        Authorization: header,
      },
    });
    if (!res.ok) throw new Error('sessionを作成するPOSTが失敗しています。');
    const data = await res.json();
    return data;
  } catch (error) {
    console.error(error);
    return;
  }
};

export const fetchDeleteSession = async () => {
  try {
    const res = await fetch('/api/auth/session', {
      method: 'DELETE',
    });

    if (!res.ok) throw new Error('sessionの削除ができませんでした。');
    return;
  } catch (error) {
    console.error(error);
    return;
  }
};
