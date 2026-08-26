'use client';

import { signOut } from 'aws-amplify/auth';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { FiLogIn, FiLogOut, FiSearch } from 'react-icons/fi';
import {
  fetchDeleteSession,
  fetchGetSession,
  type SessionUser,
} from '../api/auth/session/fetch';

const Header = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [searchMember, setSearchMember] = useState<string>('');
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
  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      await fetchDeleteSession();
      setUser(null);
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('サインアウトに失敗しました:', error);
    } finally {
      setIsSigningOut(false);
    }
  };
  const handleSearchMemberButton = () => {
    const trimSearchMember = searchMember.trim();
    if (!trimSearchMember) return;
    router.push('/search?member=' + trimSearchMember);
    setSearchMember('');
  };

  const initials = user?.name.trim().slice(0, 1).toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-50 border-b border-[#DDE4EC] bg-white/95 backdrop-blur">
      <div className="grid h-16 w-full grid-cols-[auto_minmax(90px,1fr)_auto] items-center gap-2 px-3 sm:gap-3 sm:px-4">
        <Link
          href="/"
          className="w-fit shrink-0 justify-self-start"
          aria-label="Knowledge Hub ホーム"
        >
          <Image
            src={'/compass-logo-full.png'}
            alt="Knowledge Hub"
            width={150}
            height={50}
            className="h-auto w-24 sm:w-32 lg:w-36"
            loading="eager"
          />
        </Link>

        <div className="relative col-start-2 row-start-1 h-9 w-full max-w-xs justify-self-end sm:h-10">
          <label htmlFor="header-search" className="sr-only">
            メンバーを検索
          </label>
          <input
            id="header-search"
            type="search"
            placeholder="メンバー検索"
            onChange={(e) => setSearchMember(e.target.value)}
            value={searchMember}
            className="h-full w-full rounded-xl border border-[#DDE4EC] bg-[#F8FAFC] pl-3 pr-10 text-xs text-[#344256] outline-none transition placeholder:text-[#9AA7B7] focus:border-[#254F8F]/50 focus:ring-2 focus:ring-[#254F8F]/10 sm:pr-20 sm:text-sm"
          />
          <button
            type="button"
            aria-label="メンバーを検索"
            onClick={handleSearchMemberButton}
            className="absolute right-1 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-lg bg-[#254F8F] text-xs font-bold text-white transition hover:bg-[#1E3A5F] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#254F8F] sm:h-8 sm:w-auto sm:px-3"
          >
            <FiSearch aria-hidden="true" className="size-4 sm:hidden" />
            <span className="hidden sm:inline">検索</span>
          </button>
        </div>

        <div className="col-start-3 row-start-1 flex shrink-0 items-center justify-self-end gap-2 sm:gap-3">
          {isCheckingSession ? (
            <div
              className="h-10 w-24 animate-pulse rounded-lg bg-[#EEF2F6]"
              aria-label="ログイン状態を確認中"
            />
          ) : user ? (
            <>
              <div className="flex min-w-0 items-center gap-2">
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
                <div className="hidden min-w-0 xl:block">
                  <p className="max-w-32 truncate text-sm font-bold text-[#344256]">
                    {user.name}
                  </p>
                  <p className="max-w-40 truncate text-xs text-[#7B8899]">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex h-10 items-center gap-2 rounded-lg border border-[#DDE4EC] bg-white px-3 text-sm font-semibold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#254F8F]/5 hover:text-[#254F8F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiLogOut aria-hidden="true" className="size-4" />
                <span className="hidden sm:inline">
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
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
