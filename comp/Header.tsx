'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  FiCamera,
  FiBell,
  FiBookmark,
  FiCheck,
  FiEdit3,
  FiFileText,
  FiLogIn,
  FiLogOut,
  FiUpload,
  FiX,
  FiActivity,
  FiShield,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import { useSession } from '@/lib/auth/session-context';
import { useNotifications } from '@/lib/header/use-notifications';
import { toast } from 'react-toastify';
import { useProfileEditor } from '@/lib/header/use-profile-editor';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, isCheckingSession, isSigningOut, signOut } = useSession();
  const {
    isSavingProfile, hasImageError, isProfileModalOpen, profilePreviewUrl, profileNotice,
    departments, selectedDepartmentId, profileName, profileJobTitle, profileBio,
    setHasImageError, setIsProfileModalOpen, setSelectedDepartmentId, setProfileName,
    setProfileJobTitle, setProfileBio, handleProfileImageChange, handleSaveProfileImage,
  } = useProfileEditor(user, setUser);
  const { notifications, unreadNotificationCount, markNotificationRead, markAllNotificationsRead } = useNotifications(user?.id, pathname);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isNotificationOpen) return;

    const closeNotification = (event: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsNotificationOpen(false);
    };

    document.addEventListener('mousedown', closeNotification);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeNotification);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [isNotificationOpen]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('サインアウトしました。');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('サインアウトに失敗しました:', error);
      toast.error('サインアウトできませんでした。');
    }
  };
  const initials = user?.name.trim().slice(0, 1).toUpperCase() || 'U';
  const navigationItems = [
    {
      href: '/search',
      label: 'メンバー',
      icon: FiUsers,
      isActive: pathname === '/search',
      requiresLogin: true,
    },
    {
      href: '/post',
      label: '自分の記事',
      icon: FiFileText,
      // 記事詳細は他メンバーの記事でも同じURL構造になるため、
      // 管理一覧そのものを表示している時だけ選択状態にする。
      isActive: pathname === '/post',
      requiresLogin: true,
    },
    {
      href: '/bookmarks',
      label: 'お気に入り',
      icon: FiBookmark,
      isActive: pathname === '/bookmarks',
      requiresLogin: true,
    },
    {
      href: '/activity',
      label: '履歴',
      icon: FiActivity,
      isActive: pathname === '/activity',
      requiresLogin: true,
    },
    {
      href: '/post/new',
      label: '投稿する',
      icon: FiEdit3,
      isActive: pathname === '/post/new' || pathname.endsWith('/edit'),
      requiresLogin: true,
    },
    {
      href: '/admin',
      label: '管理者画面',
      icon: FiShield,
      isActive: pathname.startsWith('/admin'),
      requiresLogin: true,
      requiresAdmin: true,
    },
  ];

  const visibleNavigationItems = navigationItems.filter(
    (item) => {
      if (item.requiresLogin && !user) return false;
      if (item.requiresAdmin && user?.role !== 'ADMIN') return false;

      return true;
    },
  );

  const navigation = (
    <nav aria-label="メインナビゲーション">
      <ul className="flex items-center gap-1">
        {visibleNavigationItems.map(({ href, label, icon: Icon, isActive }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg px-3 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254F8F] ${
                isActive
                  ? 'bg-[#FFF0E2] text-[#9A5B31]'
                  : 'text-[#6F6B66] hover:bg-[#FCF5EE] hover:text-[#9A5B31]'
              }`}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0" />
              <span>{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-[#DDE4EC] bg-white/95 backdrop-blur">
        <div className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-4 lg:flex lg:h-16 lg:gap-4 lg:px-6 lg:py-0">
          <div className="col-start-1 row-start-1 flex shrink-0 items-center gap-4 xl:gap-6">
            <Link
              href="/"
              className="flex w-fit shrink-0 items-center gap-2"
              aria-label="Knowledge Hub ホーム"
            >
              {/* モバイルではロゴ全体を縮小せず、Compassアイコンを固定サイズで表示する。 */}
              <Image
                src="/compass-logo-icon.png"
                alt="Knowledge Hub"
                width={44}
                height={44}
                className="size-10 shrink-0 sm:hidden"
                loading="eager"
              />
              <span className="text-base font-extrabold tracking-tight text-[#1E3A5F] sm:hidden">
                Compass
              </span>
              <Image
                src="/compass-logo-full.png"
                alt="Knowledge Hub"
                width={150}
                height={50}
                className="hidden h-auto w-32 sm:block lg:w-30 xl:w-36"
                loading="eager"
              />
            </Link>

            <div className="hidden lg:block">{navigation}</div>
          </div>

          <div aria-hidden="true" className="min-w-0 flex-1" />

          <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-2 sm:gap-3">
            {isCheckingSession ? (
              <div
                className="h-10 w-24 animate-pulse rounded-lg bg-[#EEF2F6]"
                aria-label="ログイン状態を確認中"
              />
            ) : user ? (
              <>
                <div ref={notificationRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsNotificationOpen((current) => !current)}
                    aria-label={`新着通知${unreadNotificationCount > 0 ? `${unreadNotificationCount}件` : ''}`}
                    aria-expanded={isNotificationOpen}
                    className="relative flex size-10 items-center justify-center rounded-full border border-[#DDE4EC] bg-white text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#254F8F]/5 hover:text-[#254F8F]"
                  >
                    <FiBell aria-hidden="true" className="size-5" />
                    {unreadNotificationCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-[#B6534D] px-1 text-[10px] font-bold leading-5 text-white ring-2 ring-white">
                        {unreadNotificationCount > 99
                          ? '99+'
                          : unreadNotificationCount}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <section
                      aria-label="新着通知"
                      className="fixed left-3 right-3 top-16 z-60 overflow-hidden rounded-2xl border border-[#DDE4EC] bg-white shadow-[0_20px_55px_rgba(20,38,61,0.2)] sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-96"
                    >
                      <div className="flex items-center justify-between border-b border-[#E8EDF2] px-4 py-3">
                        <div>
                          <h2 className="font-bold text-[#1E3A5F]">新着情報</h2>
                          <p className="text-xs text-[#7B8899]">
                            お気に入りメンバーの新着記事
                          </p>
                        </div>
                        {unreadNotificationCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllNotificationsRead}
                            className="flex items-center gap-1 text-xs font-bold text-[#765338] hover:text-[#9A5B31]"
                          >
                            <FiCheck aria-hidden="true" />
                            すべて既読
                          </button>
                        )}
                      </div>
                      <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-6 py-10 text-center">
                            <FiBell
                              aria-hidden="true"
                              className="mx-auto size-7 text-[#AAB5C2]"
                            />
                            <p className="mt-3 text-sm font-semibold text-[#66758A]">
                              新着情報はまだありません
                            </p>
                          </div>
                        ) : (
                          <ul>
                            {notifications.map((notification) => (
                              <li
                                key={notification.id}
                                className="border-b border-[#EEF1F4] last:border-0"
                              >
                                <Link
                                  href={`/post/${notification.post.id}`}
                                  onClick={() => {
                                    markNotificationRead(notification.id);
                                    setIsNotificationOpen(false);
                                  }}
                                  className={`block px-4 py-3 transition hover:bg-[#F7F9FB] ${
                                    notification.readAt ? 'bg-white' : 'bg-[#FFF8F1]'
                                  }`}
                                >
                                  <div className="flex gap-3">
                                    <span
                                      aria-hidden="true"
                                      className={`mt-1 size-2 shrink-0 rounded-full ${
                                        notification.readAt
                                          ? 'bg-transparent'
                                          : 'bg-[#B26936]'
                                      }`}
                                    />
                                    <div className="min-w-0">
                                      <p className="text-xs font-semibold text-[#7B8899]">
                                        {notification.post.author.name}さんが記事を公開しました
                                      </p>
                                      <p className="mt-1 line-clamp-2 text-sm font-bold leading-5 text-[#344256]">
                                        {notification.post.title}
                                      </p>
                                      <time className="mt-1.5 block text-[11px] text-[#9A9087]">
                                        {new Intl.DateTimeFormat('ja-JP', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        }).format(new Date(notification.createdAt))}
                                      </time>
                                    </div>
                                  </div>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </section>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  aria-label={isSigningOut ? 'サインアウト処理中' : 'サインアウト'}
                  aria-busy={isSigningOut}
                  title="サインアウト"
                  className="flex size-10 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-transparent text-sm font-semibold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#254F8F]/5 hover:text-[#254F8F] focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:border-[#DDE4EC] sm:bg-white sm:px-3"
                >
                  <FiLogOut aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">{isSigningOut ? '処理中...' : 'サインアウト'}</span>
                </button>
                <div className="hidden min-w-0 max-w-48 text-right sm:block">
                  <p className="truncate text-sm font-bold text-[#4B4E54]">
                    {user.name}
                  </p>
                  <p className="truncate text-[11px] text-[#8A8179]">
                    {user.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(true);
                  }}
                  aria-label={`${user.name}のプロフィール設定を開く`}
                  className="flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254F8F]"
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FA] text-sm font-bold text-[#254F8F] ring-2 ring-white shadow-sm">
                    {user.photoUrl && !hasImageError ? (
                      <Image
                        key={user.photoUrl}
                        src={user.photoUrl}
                        alt={`${user.name}のプロフィール画像`}
                        fill
                        sizes="40px"
                        className="object-cover"
                        onError={() => setHasImageError()}
                      />
                    ) : (
                      <span aria-hidden="true">{initials}</span>
                    )}
                  </span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/signup"
                  className="flex h-10 items-center gap-2 rounded-lg border border-[#D7B99F] bg-white px-3 text-sm font-bold text-[#9A5B31] transition hover:border-[#C88A5B] hover:bg-[#FFF8F1]"
                >
                  <FiUserPlus aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">新規登録</span>
                </Link>
                <Link
                  href="/login"
                  className="flex h-10 items-center gap-2 rounded-lg bg-[#A66334] px-3 text-sm font-bold text-white transition hover:bg-[#86502D] sm:px-4"
                >
                  <FiLogIn aria-hidden="true" className="size-4" />
                  <span className="hidden sm:inline">ログイン</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border-t border-[#EEF1F4] px-3 py-1.5 sm:px-4 lg:hidden">
          <div className="min-w-max">{navigation}</div>
        </div>
      </header>

      <AnimatePresence>
        {isProfileModalOpen && user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-100 flex items-center justify-center bg-[#14263D]/45 px-4 backdrop-blur-sm"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setIsProfileModalOpen(false);
              }
            }}
          >
            <motion.section
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="profile-modal-title"
              className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#DDE4EC] bg-white p-6 shadow-[0_24px_70px_rgba(20,38,61,0.24)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#7B8899]">
                    Profile
                  </p>
                  <h2
                    id="profile-modal-title"
                    className="mt-1 text-xl font-bold text-[#1E3A5F]"
                  >
                    プロフィールを編集
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  aria-label="プロフィール設定を閉じる"
                  className="flex size-9 items-center justify-center rounded-lg text-[#7B8899] transition hover:bg-[#F1F4F7] hover:text-[#344256]"
                >
                  <FiX aria-hidden="true" />
                </button>
              </div>

              <div className="mt-6 flex flex-col items-center">
                <div className="relative flex size-28 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FA] text-3xl font-bold text-[#254F8F] ring-4 ring-[#F3F6FA]">
                  {profilePreviewUrl || (user.photoUrl && !hasImageError) ? (
                    <Image
                      key={profilePreviewUrl ?? user.photoUrl}
                      src={profilePreviewUrl ?? user.photoUrl!}
                      alt="プロフィール画像のプレビュー"
                      fill
                      sizes="112px"
                      className="object-cover"
                    />
                  ) : (
                    <span aria-hidden="true">{initials}</span>
                  )}
                  <span className="absolute bottom-1 right-1 flex size-8 items-center justify-center rounded-full bg-[#254F8F] text-white shadow-md">
                    <FiCamera aria-hidden="true" className="size-4" />
                  </span>
                </div>
                <p className="mt-4 text-sm font-bold text-[#344256]">
                  {user.name}
                </p>
                <p className="mt-1 text-xs text-[#7B8899]">{user.email}</p>
              </div>

              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleProfileImageChange}
                className="sr-only"
              />
              <div className="mt-5 space-y-4">
                <div>
                  <label
                    htmlFor="profile-name"
                    className="mb-2 block text-sm font-bold text-[#344256]"
                  >
                    表示名 <span className="text-[#B6534D]">*</span>
                  </label>
                  <input
                    id="profile-name"
                    value={profileName}
                    onChange={(event) => setProfileName(event.target.value)}
                    maxLength={50}
                    className="h-11 w-full rounded-xl border border-[#D8E0E9] bg-[#FCFAF7] px-3 text-sm text-[#344256] outline-none focus:border-[#B97845]/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-job-title"
                    className="mb-2 block text-sm font-bold text-[#344256]"
                  >
                    役職・担当{' '}
                    <span className="font-normal text-[#8A97A8]">任意</span>
                  </label>
                  <input
                    id="profile-job-title"
                    value={profileJobTitle}
                    onChange={(event) => setProfileJobTitle(event.target.value)}
                    maxLength={80}
                    placeholder="例：フロントエンドエンジニア"
                    className="h-11 w-full rounded-xl border border-[#D8E0E9] bg-[#FCFAF7] px-3 text-sm text-[#344256] outline-none placeholder:text-[#A59B92] focus:border-[#B97845]/50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="profile-bio"
                    className="mb-2 block text-sm font-bold text-[#344256]"
                  >
                    自己紹介・得意分野{' '}
                    <span className="font-normal text-[#8A97A8]">任意</span>
                  </label>
                  <textarea
                    id="profile-bio"
                    value={profileBio}
                    onChange={(event) => setProfileBio(event.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="担当業務、詳しい技術、相談してほしいことなど"
                    className="w-full resize-none rounded-xl border border-[#D8E0E9] bg-[#FCFAF7] px-3 py-2.5 text-sm leading-6 text-[#344256] outline-none placeholder:text-[#A59B92] focus:border-[#B97845]/50"
                  />
                  <p className="mt-1 text-right text-xs text-[#9A9087]">
                    {profileBio.length} / 500
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <label
                  htmlFor="profile-department"
                  className="mb-2 block text-sm font-bold text-[#344256]"
                >
                  表示する部署名
                </label>
                <select
                  id="profile-department"
                  value={selectedDepartmentId}
                  onChange={(event) =>
                    setSelectedDepartmentId(event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-[#D8E0E9] bg-[#FCFAF7] px-3 text-sm text-[#344256] outline-none focus:border-[#B97845]/50"
                >
                  <option value="">部署未設定</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => profileFileInputRef.current?.click()}
                className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#D8E0E9] bg-white text-sm font-bold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#F8FAFC] hover:text-[#254F8F]"
              >
                <FiUpload aria-hidden="true" />
                画像を選択
              </button>
              <p className="mt-2 text-center text-xs text-[#8A97A8]">
                PNG・JPEG・WebP、5MBまで
              </p>

              {profileNotice && (
                <p className="mt-4 rounded-lg bg-[#F3F6F9] px-3 py-2 text-center text-xs font-semibold text-[#66758A]">
                  {profileNotice}
                </p>
              )}

              <button
                type="button"
                onClick={handleSaveProfileImage}
                disabled={isSavingProfile}
                className="mt-5 h-11 w-full rounded-xl bg-[#A66334] text-sm font-bold text-white transition hover:bg-[#86502D] disabled:cursor-wait disabled:opacity-60"
              >
                {isSavingProfile ? '保存中...' : '変更を保存'}
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
