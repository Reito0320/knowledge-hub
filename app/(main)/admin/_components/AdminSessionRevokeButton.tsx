'use client';

import { useState } from 'react';
import { FiLogOut } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminSessionRevokeButton = ({ userId, userName }: { userId: string; userName: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const revoke = async () => {
    const reason = window.prompt(`${userName}さんの全端末をサインアウトします。対応理由を入力してください。`);
    if (!reason?.trim()) return;
    if (!window.confirm('Cognitoの全セッションを失効しますか？')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(body.message ?? 'セッションを失効できませんでした。');
      toast.success(body.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'セッションを失効できませんでした。');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      disabled={isSubmitting}
      onClick={() => void revoke()}
      className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-lg border border-[#D6DEE7] px-3 text-xs font-bold text-[#52677E] transition hover:bg-[#F2F6FA] disabled:opacity-50"
    >
      <FiLogOut aria-hidden="true" />
      {isSubmitting ? '失効中…' : '全端末ログアウト'}
    </button>
  );
};

export default AdminSessionRevokeButton;
