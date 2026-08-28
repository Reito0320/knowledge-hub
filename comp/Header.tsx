'use client';

import { signOut } from 'aws-amplify/auth';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  FiCamera,
  FiBookmark,
  FiEdit3,
  FiFileText,
  FiLogIn,
  FiLogOut,
  FiSearch,
  FiUpload,
  FiX,
} from 'react-icons/fi';
import {
  fetchDeleteSession,
  fetchGetSession,
  type SessionUser,
} from '@/app/api/auth/session/fetch';

type MemberSuggestion = {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  department: {
    name: string;
  } | null;
};

type DepartmentOption = { id: string; name: string };

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [searchMember, setSearchMember] = useState<string>('');
  const [memberSuggestions, setMemberSuggestions] = useState<
    MemberSuggestion[]
  >([]);
  const [isSearchingMember, setIsSearchingMember] =
    useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [hasImageError, setHasImageError] = useState<boolean>(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null);
  const [profileNotice, setProfileNotice] = useState('');
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true);

      try {
        const sessionUser = await fetchGetSession();
        setUser(sessionUser);
        setSelectedDepartmentId(sessionUser?.department?.id ?? '');
        setHasImageError(false);
      } catch (error) {
        console.error('Sessionの確認に失敗しました:', error);
        setUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, []);

  useEffect(() => {
    const keyword = searchMember.trim();

    if (!keyword || !user) return;

    const abortController = new AbortController();

    // 入力のたびにAPIを呼ばず、250ms入力が止まってから候補を取得する。
    const timeoutId = window.setTimeout(async () => {
      setIsSearchingMember(true);

      try {
        const response = await fetch(
          '/api/users/suggestions?q=' + encodeURIComponent(keyword),
          { signal: abortController.signal },
        );

        if (!response.ok) throw new Error('メンバー候補を取得できません。');

        const data: { users: MemberSuggestion[] } = await response.json();
        setMemberSuggestions(data.users);
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error(error);
        setMemberSuggestions([]);
      } finally {
        if (!abortController.signal.aborted) setIsSearchingMember(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [searchMember, user]);

  useEffect(() => {
    if (!isProfileModalOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsProfileModalOpen(false);
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isProfileModalOpen]);

  useEffect(() => {
    if (!isProfileModalOpen || departments.length > 0) return;

    void fetch('/api/departments')
      .then((response) => response.json())
      .then((data: { departments: DepartmentOption[] }) =>
        setDepartments(data.departments),
      )
      .catch((error) => console.error('部署一覧を取得できませんでした:', error));
  }, [departments.length, isProfileModalOpen]);

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

  const handleProfileImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setProfileNotice('画像ファイルを選択してください。');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setProfileNotice('画像は5MB以下にしてください。');
      return;
    }

    setProfileImageFile(file);
    setProfilePreviewUrl(URL.createObjectURL(file));
    setProfileNotice('プレビューを確認して保存してください。');
  };

  const handleSaveProfileImage = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ departmentId: selectedDepartmentId || null }),
      });
      if (!response.ok) throw new Error('プロフィールを更新できませんでした。');

      const data = (await response.json()) as { user: SessionUser };
      setUser(data.user);

      if (!profileImageFile) {
        setProfileNotice('部署を更新しました。');
        return;
      }

      // TODO: S3の署名付きURLを取得し、profileImageFileをアップロードする。
      // TODO: アップロード後のS3 URLをUser.photoUrlへ保存するAPIを呼び出す。
      setProfileNotice(
        '部署を更新しました。画像保存はS3接続後に利用できます。',
      );
    } catch (error) {
      console.error(error);
      setProfileNotice('プロフィールを更新できませんでした。');
    }
  };
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await fetchDeleteSession();
      await signOut();
      setUser(null);
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('サインアウトに失敗しました:', error);
    } finally {
      setIsSigningOut(false);
    }
  };
  const handleSearchMember = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimSearchMember = searchMember.trim();
    if (!trimSearchMember) return;
    router.push('/search?member=' + encodeURIComponent(trimSearchMember));
    setMemberSuggestions([]);
    setSearchMember('');
  };

  const handleMemberInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const nextValue = event.target.value;
    setSearchMember(nextValue);
    // 前の入力に対する候補を残さず、現在の文字列の検索完了を待つ。
    setMemberSuggestions([]);
    setIsSearchingMember(Boolean(nextValue.trim()));
  };

  const handleSelectMember = (member: MemberSuggestion) => {
    const params = new URLSearchParams({
      member: member.name,
      memberId: member.id,
    });

    router.push('/search?' + params.toString());
    setMemberSuggestions([]);
    setSearchMember('');
  };

  const initials = user?.name.trim().slice(0, 1).toUpperCase() || 'U';
  const navigationItems = [
    {
      href: '/post',
      label: '自分の記事',
      icon: FiFileText,
      isActive:
        pathname === '/post' ||
        (/^\/post\/[^/]+$/.test(pathname) && pathname !== '/post/new'),
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
      href: '/post/new',
      label: '投稿する',
      icon: FiEdit3,
      isActive:
        pathname === '/post/new' || pathname.endsWith('/edit'),
      requiresLogin: true,
    },
  ];

  const visibleNavigationItems = navigationItems.filter(
    (item) => !item.requiresLogin || Boolean(user),
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
                  ? 'bg-[#E8F0FA] text-[#254F8F]'
                  : 'text-[#66758A] hover:bg-[#F3F6F9] hover:text-[#254F8F]'
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

        <form
          onSubmit={handleSearchMember}
          className="relative col-span-3 row-start-2 h-10 min-w-0 w-full lg:col-auto lg:row-auto lg:ml-auto lg:max-w-72 xl:max-w-96"
        >
          <label htmlFor="header-search" className="sr-only">
            メンバーを検索
          </label>
          <input
            id="header-search"
            type="search"
            placeholder="メンバー検索"
            onChange={handleMemberInputChange}
            value={searchMember}
            autoComplete="off"
            className="h-full w-full rounded-xl border border-[#DDE4EC] bg-[#F8FAFC] pl-3 pr-10 text-xs text-[#344256] outline-none transition placeholder:text-[#9AA7B7] focus:border-[#254F8F]/50 focus:ring-2 focus:ring-[#254F8F]/10 sm:pr-20 sm:text-sm"
          />
          <button
            type="submit"
            aria-label="メンバーを検索"
            className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg bg-[#254F8F] text-xs font-bold text-white transition hover:bg-[#1E3A5F] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#254F8F] sm:h-8 sm:w-auto sm:px-3"
          >
            <FiSearch aria-hidden="true" className="size-4 sm:hidden" />
            <span className="hidden sm:inline">検索</span>
          </button>

          {searchMember.trim() && user && (
            <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] overflow-hidden rounded-xl border border-[#DDE4EC] bg-white shadow-[0_16px_35px_rgba(30,58,95,0.14)]">
              {isSearchingMember ? (
                <p className="px-4 py-3 text-xs text-[#7B8899]">
                  メンバーを検索中...
                </p>
              ) : memberSuggestions.length > 0 ? (
                <ul aria-label="メンバーの検索候補">
                  {memberSuggestions.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectMember(member)}
                        className="flex w-full items-center gap-3 border-b border-[#EEF1F4] px-3 py-3 text-left transition last:border-b-0 hover:bg-[#F5F8FC] focus-visible:bg-[#F5F8FC] focus-visible:outline-none"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E8F0FA] text-xs font-bold text-[#254F8F]">
                          {member.name.trim().slice(0, 1) || 'U'}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[#344256]">
                            {member.name}
                          </span>
                          <span className="block truncate text-xs text-[#7B8899]">
                            {member.department?.name ??
                              member.jobTitle ??
                              member.email}
                          </span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-4 py-3 text-xs text-[#7B8899]">
                  一致するメンバーはいません。
                </p>
              )}
            </div>
          )}
        </form>

        <div className="col-start-3 row-start-1 flex shrink-0 items-center gap-2 sm:gap-3">
          {isCheckingSession ? (
            <div
              className="h-10 w-24 animate-pulse rounded-lg bg-[#EEF2F6]"
              aria-label="ログイン状態を確認中"
            />
          ) : user ? (
            <>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg border border-[#DDE4EC] bg-white px-3 text-sm font-semibold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#254F8F]/5 hover:text-[#254F8F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiLogOut aria-hidden="true" className="size-4" />
                <span>{isSigningOut ? '処理中...' : 'サインアウト'}</span>
              </button>
              <div className="group relative">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(true);
                    setProfileNotice('');
                  }}
                  aria-label={`${user.name}のプロフィール設定を開く`}
                  className="flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254F8F]"
                >
                  <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FA] text-sm font-bold text-[#254F8F] ring-2 ring-white shadow-sm">
                    {user.photoUrl && !hasImageError ? (
                      <Image
                        src={user.photoUrl}
                        alt={`${user.name}のプロフィール画像`}
                        fill
                        sizes="40px"
                        className="object-cover"
                        onError={() => setHasImageError(true)}
                      />
                    ) : (
                      <span aria-hidden="true">{initials}</span>
                    )}
                  </span>
                </button>

                <div className="pointer-events-none invisible absolute right-0 top-[calc(100%+0.65rem)] z-50 w-64 translate-y-1 rounded-xl border border-[#DDE4EC] bg-white p-4 opacity-0 shadow-[0_16px_40px_rgba(30,58,95,0.16)] transition duration-150 before:absolute before:-top-3 before:right-0 before:h-3 before:w-full before:content-[''] group-hover:pointer-events-auto group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#E8F0FA] text-sm font-bold text-[#254F8F]">
                      {initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-[#344256]">
                        {user.name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#7B8899]">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 border-t border-[#EEF1F4] pt-3 text-xs text-[#8A97A8]">
                    クリックするとプロフィール設定を開きます
                  </p>
                </div>
              </div>
            </>
          ) : (
            <Link
              href="/login"
              className="flex h-10 items-center gap-2 rounded-lg bg-[#254F8F] px-4 text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
            >
              <FiLogIn aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">ログイン</span>
            </Link>
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
              className="w-full max-w-md rounded-2xl border border-[#DDE4EC] bg-white p-6 shadow-[0_24px_70px_rgba(20,38,61,0.24)]"
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
                    プロフィール画像を設定
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
                className="mt-5 h-11 w-full rounded-xl bg-[#254F8F] text-sm font-bold text-white transition hover:bg-[#1E3A5F]"
              >
                変更を保存
              </button>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
