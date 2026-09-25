'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { signOut as signOutCognito } from 'aws-amplify/auth';
import { fetchDeleteSession, fetchGetSession, type SessionUser } from '@/lib/api/auth/session/fetch';

type SessionState = { user: SessionUser | null; isCheckingSession: boolean; isSigningOut: boolean };
type SessionAction =
  | { type: 'checking' }
  | { type: 'loaded'; user: SessionUser | null }
  | { type: 'signingOut' }
  | { type: 'signOutFinished' };

function reducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'checking': return { ...state, isCheckingSession: true };
    case 'loaded': return { ...state, user: action.user, isCheckingSession: false };
    case 'signingOut': return { ...state, isSigningOut: true };
    case 'signOutFinished': return { ...state, isSigningOut: false, isCheckingSession: false };
  }
}

function useSessionController() {
  const [state, dispatch] = useReducer(reducer, { user: null, isCheckingSession: true, isSigningOut: false });
  const requestId = useRef(0);
  const signingOut = useRef(false);

  const refreshSession = useCallback(async () => {
    if (signingOut.current) return;
    const id = ++requestId.current;
    dispatch({ type: 'checking' });
    try {
      const user = await fetchGetSession();
      if (id === requestId.current) dispatch({ type: 'loaded', user });
    } catch {
      if (id === requestId.current) dispatch({ type: 'loaded', user: null });
    }
  }, []);

  useEffect(() => {
    void refreshSession();
    return () => { requestId.current += 1; };
  }, [refreshSession]);

  const setUser = useCallback((user: SessionUser | null) => {
    // An older GET must not overwrite a newly saved profile or logout.
    requestId.current += 1;
    dispatch({ type: 'loaded', user });
  }, []);

  const signOut = useCallback(async () => {
    if (signingOut.current) return;
    signingOut.current = true;
    requestId.current += 1;
    dispatch({ type: 'signingOut' });
    try {
      await fetchDeleteSession();
      setUser(null);
      await signOutCognito();
    } finally {
      signingOut.current = false;
      dispatch({ type: 'signOutFinished' });
    }
  }, [setUser]);

  return useMemo(() => ({ ...state, refreshSession, setUser, signOut }), [state, refreshSession, setUser, signOut]);
}

const SessionContext = createContext<ReturnType<typeof useSessionController> | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionController();
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within SessionProvider');
  return session;
}
