import { redirect } from 'next/navigation';
import { handleSignup } from './auth';
import { prisma } from './prisma';
import { createSession } from './session';

export const handleLoginAction = async (formData: FormData) => {
  'use server';
  const email = formData.get('mail') as string;
  const password = formData.get('password') as string;

  if (!email || !password) return;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      passwordHash: true,
    },
  });

  if (!user) return;

  await createSession(String(user?.id));
};

export const handleSignupAction = async (formData: FormData) => {
  'use server';

  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!name || !email || !password) return;

  const { user, error } = await handleSignup(email, password);

  if (!user) {
    console.error(error);
    return;
  }

  await prisma.user.create({
    data: {
      id: user.uid,
      name,
      email,
      photoUrl: user.photoURL ?? null,
    },
  });

  await createSession(String(user.uid));
  redirect('/');
};
