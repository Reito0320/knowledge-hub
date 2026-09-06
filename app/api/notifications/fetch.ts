import { readJsonResponse } from '@/lib/http/read-json-response';

export type NewPostNotification = {
  id: string;
  readAt: string | null;
  createdAt: string;
  post: {
    id: string;
    title: string;
    author: { name: string };
  };
};

export const fetchNotifications = async () => {
  const response = await fetch('/api/notifications', { cache: 'no-store' });
  const data = await readJsonResponse<{
    notifications: NewPostNotification[];
    unreadCount: number;
    message?: string;
  }>(response);

  if (!response.ok) throw new Error(data.message ?? '通知を取得できませんでした。');
  return data;
};

export const fetchMarkNotificationsRead = async (notificationId?: string) => {
  const response = await fetch('/api/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationId ? { notificationId } : {}),
  });
  const data = await readJsonResponse<{ updatedCount: number; message?: string }>(
    response,
  );

  if (!response.ok)
    throw new Error(data.message ?? '通知を既読にできませんでした。');
  return data;
};
