// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useNotifications } from '@/lib/header/use-notifications';
import { useProfileEditor } from '@/lib/header/use-profile-editor';
import type { SessionUser } from '@/lib/api/auth/session/fetch';
import type { ChangeEvent } from 'react';

const mocks = vi.hoisted(() => ({ notifications: vi.fn(), read: vi.fn(), profile: vi.fn() }));
vi.mock('@/lib/api/notifications/fetch', () => ({ fetchNotifications: mocks.notifications, fetchMarkNotificationsRead: mocks.read }));
vi.mock('@/lib/api/users/profile/fetch', () => ({ fetchPatchUserProfile: mocks.profile }));
vi.mock('@/lib/api/users/profile/image-upload/fetch', () => ({
  requestProfileImageUpload: vi.fn(), saveProfileImageObjectKey: vi.fn(), uploadProfileImageToS3: vi.fn(),
}));
vi.mock('react-toastify', () => ({ toast: { success: vi.fn() } }));
const user: SessionUser = { id: 'u1', name: 'Alice', email: 'a@example.com', role: 'MEMBER', status: 'ACTIVE', photoUrl: null, jobTitle: 'Engineer', bio: 'Hello', department: { id: 'd1', name: '開発部' } };
const notification = { id: 'n1', readAt: null, createdAt: '2026-09-01', post: { id: 'p1', title: '新着', author: { name: 'Bob' } } };
const unread = { notifications: [notification], unreadCount: 2 };

beforeEach(() => {
  vi.resetAllMocks();
  mocks.notifications.mockResolvedValue(unread);
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ departments: [] }) }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('marks a notification once and keeps unread count consistent', async () => {
  const { result } = renderHook(() => useNotifications('u1', '/'));
  await act(async () => {});
  let finish!: () => void;
  mocks.read.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
  act(() => { result.current.markNotificationRead('n1'); result.current.markNotificationRead('n1'); });
  expect(mocks.read).toHaveBeenCalledTimes(1);
  mocks.notifications.mockResolvedValue({ notifications: [{ ...notification, readAt: '2026-09-24' }], unreadCount: 1 });
  await act(async () => { finish(); });
  expect(result.current.unreadNotificationCount).toBe(1);
  expect(result.current.notifications[0].readAt).not.toBeNull();
});

it('does not claim a failed notification update succeeded', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  mocks.read.mockRejectedValue(new Error('offline'));
  const { result } = renderHook(() => useNotifications('u1', '/'));
  await act(async () => {});
  await act(async () => { result.current.markAllNotificationsRead(); });
  expect(result.current.unreadNotificationCount).toBe(2);
  expect(result.current.notifications[0].readAt).toBeNull();
});

it('hides another account’s notifications and ignores a late response after logout', async () => {
  const { result, rerender } = renderHook(({ id }: { id?: string }) => useNotifications(id, '/'), { initialProps: { id: 'u1' } as { id?: string } });
  await act(async () => {});
  let finish!: (data: typeof unread) => void;
  mocks.notifications.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  rerender({ id: 'u2' });
  expect(result.current.notifications).toEqual([]);
  rerender({ id: undefined });
  await act(async () => { finish(unread); });
  expect(result.current.notifications).toEqual([]);
  expect(result.current.unreadNotificationCount).toBe(0);
});

it('resets all profile fields together on reopen', async () => {
  const { result } = renderHook(() => useProfileEditor(user, vi.fn()));
  await act(async () => { result.current.setIsProfileModalOpen(true); });
  act(() => { result.current.setProfileName('Unsubmitted'); result.current.setProfileBio('changed'); });
  act(() => result.current.setIsProfileModalOpen(false));
  await act(async () => { result.current.setIsProfileModalOpen(true); });
  expect(result.current.profileName).toBe('Alice');
  expect(result.current.profileBio).toBe('Hello');
  expect(result.current.selectedDepartmentId).toBe('d1');
});

it('releases a profile image preview on close', async () => {
  const revoke = vi.fn();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:preview') });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revoke });
  const { result } = renderHook(() => useProfileEditor(user, vi.fn()));
  await act(async () => { result.current.setIsProfileModalOpen(true); });
  act(() => result.current.handleProfileImageChange({ target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] } } as unknown as ChangeEvent<HTMLInputElement>));
  expect(result.current.profilePreviewUrl).toBe('blob:preview');
  act(() => result.current.setIsProfileModalOpen(false));
  expect(revoke).toHaveBeenCalledWith('blob:preview');
  expect(result.current.profilePreviewUrl).toBeNull();
});

it('does not restore a profile when its save finishes after logout', async () => {
  const setUser = vi.fn();
  let finish!: (data: { user: SessionUser }) => void;
  mocks.profile.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
  const { result, rerender } = renderHook(({ account }: { account: SessionUser | null }) => useProfileEditor(account, setUser), { initialProps: { account: user } as { account: SessionUser | null } });
  await act(async () => { result.current.setIsProfileModalOpen(true); });
  act(() => { void result.current.handleSaveProfileImage(); });
  rerender({ account: null });
  await act(async () => { finish({ user }); });
  expect(setUser).not.toHaveBeenCalled();
  expect(result.current.isProfileModalOpen).toBe(false);
});
