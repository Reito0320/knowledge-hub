'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'react-toastify';

type UserStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED';

type AdminStatusControlProps = {
  userId: string;
  userName: string;
  currentStatus: UserStatus;
  isCurrentUser: boolean;
};

const statusLabels: Record<UserStatus, string> = {
  PENDING: '承認待ち',
  ACTIVE: '利用可能',
  SUSPENDED: '利用停止',
};

const AdminStatusControl = ({
  userId,
  userName,
  currentStatus,
  isCurrentUser,
}: AdminStatusControlProps) => {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (nextStatus: UserStatus) => {
    if (nextStatus === currentStatus) return;

    const shouldUpdate = window.confirm(
      `${userName}さんの状態を「${statusLabels[nextStatus]}」へ変更しますか？`,
    );
    if (!shouldUpdate) return;

    setIsUpdating(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const body = (await response.json()) as { message?: string };
      if (!response.ok) {
        throw new Error(body.message ?? '利用状態を変更できませんでした。');
      }

      toast.success(`${userName}さんの利用状態を変更しました。`);
      router.refresh();
    } catch (error) {
      let message = '利用状態を変更できませんでした。';
      if (error instanceof Error) message = error.message;
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  let statusClassName = 'border-[#E7CBC7] bg-[#FFF5F3] text-[#A3544E]';
  if (currentStatus === 'ACTIVE') {
    statusClassName = 'border-[#CFE0D1] bg-[#F3F8F3] text-[#527158]';
  }
  if (currentStatus === 'PENDING') {
    statusClassName = 'border-[#E9D7B8] bg-[#FFF9ED] text-[#96682F]';
  }

  let title = 'ユーザーの利用状態を変更';
  if (isCurrentUser) title = '自分自身の利用状態は変更できません';

  return (
    <select
      value={currentStatus}
      disabled={isCurrentUser || isUpdating}
      onChange={(event) => {
        const nextStatus = event.target.value;
        if (
          nextStatus !== 'PENDING' &&
          nextStatus !== 'ACTIVE' &&
          nextStatus !== 'SUSPENDED'
        ) {
          return;
        }
        void handleStatusChange(nextStatus);
      }}
      aria-label={`${userName}の利用状態`}
      title={title}
      className={`h-9 rounded-lg border px-2 text-sm font-semibold outline-none transition focus:border-[#B26936] disabled:cursor-not-allowed disabled:opacity-60 ${statusClassName}`}
    >
      <option value="PENDING">承認待ち</option>
      <option value="ACTIVE">利用可能</option>
      <option value="SUSPENDED">利用停止</option>
    </select>
  );
};

export default AdminStatusControl;
