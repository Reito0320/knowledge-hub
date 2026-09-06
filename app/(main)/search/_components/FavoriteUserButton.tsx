'use client';

import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { toast } from 'react-toastify';

type FavoriteUserButtonProps = {
  userId: string;
  userName: string;
  initialFavorited: boolean;
};

const FavoriteUserButton = ({
  userId,
  userName,
  initialFavorited,
}: FavoriteUserButtonProps) => {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleFavorite = async () => {
    if (isUpdating) return;
    setIsUpdating(true);

    try {
      const response = await fetch(`/api/users/${userId}/favorite`, {
        method: 'POST',
      });
      const data = (await response.json()) as {
        favorited?: boolean;
        message?: string;
      };
      if (!response.ok || typeof data.favorited !== 'boolean') {
        throw new Error(data.message ?? 'お気に入りを更新できませんでした。');
      }

      setFavorited(data.favorited);
      toast.success(
        data.favorited
          ? `${userName}さんをお気に入りに追加しました。`
          : `${userName}さんをお気に入りから外しました。`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'お気に入りを更新できませんでした。',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggleFavorite}
      disabled={isUpdating}
      aria-pressed={favorited}
      className={`ml-auto inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-wait disabled:opacity-60 ${
        favorited
          ? 'border-[#D8A84E] bg-[#FFF7DD] text-[#8A641C]'
          : 'border-[#D8E0E9] bg-white text-[#66758A] hover:border-[#D8A84E] hover:text-[#8A641C]'
      }`}
    >
      <FiStar className={favorited ? 'fill-current' : ''} aria-hidden="true" />
      {favorited ? 'お気に入り済み' : 'お気に入り'}
    </button>
  );
};

export default FavoriteUserButton;
