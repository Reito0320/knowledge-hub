const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') ?? '';

type SessionResponse = {
  message: string;
};

export const fetchPostCreateSession = async (header: string) => {
  const res = await fetch(`${apiBaseUrl}/api/auth/session`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Authorization: header,
    },
  });
  const data = (await res.json()) as SessionResponse;

  if (!res.ok) throw new Error(data.message);

  return data;
};

export const fetchDeleteSession = async () => {
  const res = await fetch(`${apiBaseUrl}/api/auth/session`, {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = (await res.json()) as SessionResponse;

  if (!res.ok) throw new Error(data.message);
};
