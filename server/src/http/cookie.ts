import { AsyncLocalStorage } from 'node:async_hooks';

export const cookieContext = new AsyncLocalStorage<{
  incoming: string;
  outgoing: string[];
}>();

function context() {
  const value = cookieContext.getStore();
  if (!value) throw new Error('Cookie access requires an HTTP request context');
  return value;
}

export const getCookie = async (key: string) => {
  const cookie = context().incoming.split(';').map((part) => part.trim())
    .find((part) => part.startsWith(`${key}=`));
  if (!cookie) return undefined;
  try { return decodeURIComponent(cookie.slice(key.length + 1)); }
  catch { return undefined; }
};

export const setCookie = async (key: string, value: string, maxAge: number | null = 6 * 60 * 60) => {
  context().outgoing.push(`${key}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax${maxAge === null ? '' : `; Max-Age=${maxAge}`}`);
};

export const deleteCookie = async (key: string) => {
  context().outgoing.push(`${key}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
};
