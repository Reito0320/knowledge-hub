'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';

type UserRole = 'MEMBER' | 'ADMIN';

type AdminRoleControlProps = {
  userId: string;
  userName: string;
  currentRole: UserRole;
  isCurrentUser: boolean;
};

const AdminRoleControl = ({ userId, userName, currentRole, isCurrentUser }: AdminRoleControlProps) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleRoleChange = async (nextRole: UserRole) => {
    if (nextRole === currentRole) return;

    const roleLabel = nextRole === 'ADMIN' ? '管理者' : '一般メンバー';
    const shouldUpdate = window.confirm(`${userName}さんの権限を「${roleLabel}」へ変更しますか？`);
    if (!shouldUpdate) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(body.message ?? '権限を変更できませんでした。');

      toast.success(`${userName}さんの権限を変更しました。`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : '権限を変更できませんでした。';
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <select
      value={currentRole}
      disabled={isCurrentUser || isUpdating}
      onChange={(event) => {
        const nextRole = event.target.value;
        if (nextRole !== 'MEMBER' && nextRole !== 'ADMIN') return;
        void handleRoleChange(nextRole);
      }}
      aria-label={`${userName}の権限`}
      title={isCurrentUser ? '自分自身の管理者権限は変更できません' : 'ユーザーの権限を変更'}
      className="h-9 rounded-lg border border-[#DDD5CD] bg-white px-2 text-sm font-semibold text-[#625D58] outline-none transition focus:border-[#B26936] disabled:cursor-not-allowed disabled:bg-[#F4F1EE] disabled:text-[#A09790]"
    >
      <option value="MEMBER">一般メンバー</option>
      <option value="ADMIN">管理者</option>
    </select>
  );
};

export default AdminRoleControl;
