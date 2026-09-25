import { AsyncLocalStorage } from 'node:async_hooks';
import type { CognitoSession } from './auth.service';

export type RequestIdentity = {
  session: CognitoSession;
  user?: { id: string; role: 'MEMBER' | 'ADMIN' };
};
export const identityContext = new AsyncLocalStorage<RequestIdentity | undefined>();

// Accessors only: the global Nest Guard is the sole authentication/authorization boundary.
export const getCurrentUser = async () => identityContext.getStore()?.user?.id;
export const getCurrentAdmin = async () => {
  const user = identityContext.getStore()?.user;
  return user?.role === 'ADMIN' ? { id: user.id } : null;
};
export const getVerifiedCognitoSession = async () => identityContext.getStore()?.session ?? null;
