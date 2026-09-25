// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SessionProvider, useSession } from '@/lib/auth/session-context';
import type { SessionUser } from '@/lib/api/auth/session/fetch';

const mocks = vi.hoisted(() => ({ get: vi.fn(), remove: vi.fn(), signOut: vi.fn() }));
vi.mock('@/lib/api/auth/session/fetch', () => ({ fetchGetSession: mocks.get, fetchDeleteSession: mocks.remove }));
vi.mock('aws-amplify/auth', () => ({ signOut: mocks.signOut }));
const user: SessionUser = { id: 'u1', name: 'Alice', email: 'a@example.com', role: 'MEMBER', status: 'ACTIVE', photoUrl: null, jobTitle: null, bio: null, department: null };
function Account() {
  const { user, isCheckingSession } = useSession();
  return <output>{isCheckingSession ? 'loading' : user?.name ?? 'anonymous'}</output>;
}
function Controls() {
  const { user, setUser, refreshSession, signOut } = useSession();
  return <><button onClick={() => void refreshSession()}>refresh</button>
    <button onClick={() => user && setUser({ ...user, name: 'Updated' })}>profile</button>
    <button onClick={() => void signOut()}>logout</button></>;
}
async function setup() {
  await act(async () => { render(<SessionProvider><Account /><Controls /></SessionProvider>); });
}
beforeEach(() => { vi.resetAllMocks(); mocks.get.mockResolvedValue(user); });
afterEach(cleanup);

it('fetches one session for all consumers and shares profile updates', async () => {
  await setup();
  expect(screen.getByText('Alice')).toBeTruthy();
  expect(mocks.get).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByText('profile'));
  expect(screen.getByText('Updated')).toBeTruthy();
});

it('does not let an older refresh overwrite a saved profile', async () => {
  await setup();
  let finish!: (user: SessionUser) => void;
  mocks.get.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  fireEvent.click(screen.getByText('refresh'));
  fireEvent.click(screen.getByText('profile'));
  await act(async () => { finish(user); });
  expect(screen.getByText('Updated')).toBeTruthy();
});

it('does not restore a logged-out user from a delayed session response', async () => {
  await setup();
  let finish!: (user: SessionUser) => void;
  mocks.get.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  fireEvent.click(screen.getByText('refresh'));
  await act(async () => { fireEvent.click(screen.getByText('logout')); });
  await act(async () => { finish(user); });
  expect(screen.getByText('anonymous')).toBeTruthy();
  expect(mocks.remove).toHaveBeenCalledOnce();
  expect(mocks.signOut).toHaveBeenCalledOnce();
});

it('settles into an anonymous state when session loading fails', async () => {
  mocks.get.mockRejectedValue(new Error('offline'));
  await setup();
  expect(screen.getByText('anonymous')).toBeTruthy();
});
