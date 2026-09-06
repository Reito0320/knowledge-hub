import { cookies } from 'next/headers';

export const getCookie = async (key: string) => {
  try {
    const cookieStore = await cookies();
    const getValue = cookieStore.get(key)?.value;
    return getValue;
  } catch (error) {
    console.error(error);
    throw new Error('fail getCookie');
  }
};

export const setCookie = async (
  key: string,
  value: string,
  maxAge = 6 * 60 * 60,
) => {
  try {
    const cookieStore = await cookies();

    cookieStore.set(key, value, {
      secure: true,
      sameSite: 'lax',
      maxAge,
      httpOnly: true,
      path: '/',
    });

    return;
  } catch (error) {
    console.error(error);
    throw new Error('fail setCookie');
  }
};

export const deleteCookie = async (key: string) => {
  try {
    const cookieStore = await cookies();

    cookieStore.delete(key);

    return;
  } catch (error) {
    console.error(error);
    throw new Error('fail deleteCookie');
  }
};
