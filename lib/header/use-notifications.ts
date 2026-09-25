'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { fetchMarkNotificationsRead, fetchNotifications, type NewPostNotification } from '@/lib/api/notifications/fetch';

type State = { userId?: string; notifications: NewPostNotification[]; unreadNotificationCount: number };
type Action =
  | { type: 'loaded'; userId: string; notifications: NewPostNotification[]; unreadCount: number }
  | { type: 'read'; id?: string; readAt: string };
const initialState: State = { notifications: [], unreadNotificationCount: 0 };
function reducer(state: State, action: Action): State {
  if (action.type === 'loaded') return { userId: action.userId, notifications: action.notifications, unreadNotificationCount: action.unreadCount };
  const newlyRead = state.notifications.filter((item) => !item.readAt && (!action.id || item.id === action.id)).length;
  return {
    ...state,
    notifications: state.notifications.map((item) => !item.readAt && (!action.id || item.id === action.id) ? { ...item, readAt: action.readAt } : item),
    unreadNotificationCount: action.id ? Math.max(0, state.unreadNotificationCount - newlyRead) : 0,
  };
}

export function useNotifications(userId: string | undefined, pathname: string) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const generation = useRef(0);
  const owner = useRef(userId);
  const pending = useRef(new Set<string>());
  const reload = useCallback(async () => {
    if (!userId || owner.current !== userId) return;
    const version = ++generation.current;
    try {
      const data = await fetchNotifications();
      if (version === generation.current) dispatch({ type: 'loaded', userId, ...data });
    } catch (error) {
      console.error('通知の取得に失敗しました:', error);
    }
  }, [userId]);

  useEffect(() => {
    owner.current = userId;
    void reload();
    const timer = window.setInterval(() => void reload(), 60_000);
    const focus = () => void reload();
    window.addEventListener('focus', focus);
    return () => {
      owner.current = undefined;
      generation.current += 1;
      window.clearInterval(timer);
      window.removeEventListener('focus', focus);
    };
  }, [pathname, reload, userId]);

  const markRead = async (id?: string) => {
    const key = id ?? '*';
    if (pending.current.has(key) || pending.current.has('*')) return;
    if (id ? !state.notifications.some((item) => item.id === id && !item.readAt) : !state.unreadNotificationCount) return;
    pending.current.add(key);
    // Do not let a poll that started before this mutation overwrite its result.
    generation.current += 1;
    try {
      await fetchMarkNotificationsRead(id);
      if (userId && owner.current === userId) dispatch({ type: 'read', id, readAt: new Date().toISOString() });
    } catch (error) {
      console.error('通知を既読にできませんでした:', error);
    } finally {
      pending.current.delete(key);
      void reload();
    }
  };

  return {
    ...(userId && state.userId === userId ? state : initialState),
    markNotificationRead: (id: string) => { void markRead(id); },
    markAllNotificationsRead: () => { void markRead(); },
  };
}
