'use client';

import { signOut } from 'aws-amplify/auth';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FiEdit3,
  FiFileText,
  FiHome,
  FiLogIn,
  FiLogOut,
  FiSearch,
  FiUsers,
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

  useEffect(() => {
    const checkSession = async () => {
      setIsCheckingSession(true);

      try {
        const sessionUser = await fetchGetSession();
        setUser(sessionUser);
        setHasImageError(false);
      } catch (error) {
        console.error('Sessionの確認に失敗しました:', error);
        setUser(null);
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkSession();
  }, [pathname]);

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
      href: '/',
      label: 'ホーム',
      icon: FiHome,
      isActive: pathname === '/',
      requiresLogin: false,
    },
    {
      href: '/search',
      label: 'メンバー検索',
      icon: FiUsers,
      isActive: pathname.startsWith('/search'),
      requiresLogin: false,
    },
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
    <header className="sticky top-0 z-50 border-b border-[#DDE4EC] bg-white/95 backdrop-blur">
      <div className="flex h-16 w-full items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:gap-4 lg:px-6">
        <div className="flex shrink-0 items-center gap-4 xl:gap-6">
          <Link
            href="/"
            className="w-fit shrink-0"
            aria-label="Knowledge Hub ホーム"
          >
            <Image
              src={'/compass-logo-full.png'}
              alt="Knowledge Hub"
              width={150}
              height={50}
              className="h-auto w-24 sm:w-32 lg:w-30 xl:w-36"
              loading="eager"
            />
          </Link>

          <div className="hidden lg:block">{navigation}</div>
        </div>

        <form
          onSubmit={handleSearchMember}
          className="relative ml-auto h-9 min-w-0 flex-1 sm:h-10 lg:max-w-52 xl:max-w-72"
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

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {isCheckingSession ? (
            <div
              className="h-10 w-24 animate-pulse rounded-lg bg-[#EEF2F6]"
              aria-label="ログイン状態を確認中"
            />
          ) : user ? (
            <>
              <Link
                href="/post"
                aria-label={`${user.name}の記事一覧`}
                className="flex min-w-0 items-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254F8F]"
              >
                <div className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FA] text-sm font-bold text-[#254F8F] ring-2 ring-white shadow-sm">
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
                </div>
                <div className="hidden min-w-0 2xl:block">
                  <p className="max-w-32 truncate text-sm font-bold text-[#344256]">
                    {user.name}
                  </p>
                  <p className="max-w-40 truncate text-xs text-[#7B8899]">
                    {user.email}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#DDE4EC] bg-white px-3 text-sm font-semibold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#254F8F]/5 hover:text-[#254F8F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiLogOut aria-hidden="true" className="size-4" />
                <span className="hidden xl:inline">
                  {isSigningOut ? '処理中...' : 'サインアウト'}
                </span>
              </button>
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
  );
};

export default Header;
