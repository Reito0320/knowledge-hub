import Image from 'next/image';

type UserAvatarProps = {
  name: string;
  photoUrl: string | null;
  size?: 28 | 32 | 40 | 48;
  className?: string;
};

const sizeClasses = {
  28: 'size-7 text-[10px]',
  32: 'size-8 text-xs',
  40: 'size-10 text-sm',
  48: 'size-12 text-base',
} as const;

const UserAvatar = ({
  name,
  photoUrl,
  size = 40,
  className = '',
}: UserAvatarProps) => (
  <span
    className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FA] font-bold text-[#254F8F] ${sizeClasses[size]} ${className}`}
  >
    {photoUrl ? (
      <Image
        src={photoUrl}
        alt={`${name}のプロフィール画像`}
        fill
        sizes={`${size}px`}
        className="object-cover"
      />
    ) : (
      <span aria-hidden="true">{name.trim().slice(0, 1) || 'U'}</span>
    )}
  </span>
);

export default UserAvatar;
