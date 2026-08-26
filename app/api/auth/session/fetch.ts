type SessionResponse = {
  message: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  photoUrl: string | null;
};

type GetSessionResponse = SessionResponse & {
  user: SessionUser;
};

export const fetchGetSession = async () => {
  const res = await fetch('/api/auth/session', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) return null;

  const data = (await res.json()) as GetSessionResponse;
  return data.user;
};

export const fetchPostCreateSession = async (header: string) => {
  const res = await fetch('/api/auth/session', {
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
  const res = await fetch('/api/auth/session', {
    method: 'DELETE',
    credentials: 'include',
  });
  const data = (await res.json()) as SessionResponse;

  if (!res.ok) throw new Error(data.message);
};
