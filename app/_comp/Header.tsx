'use client';

import { signOut } from 'aws-amplify/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import { fetchDeleteSession } from '../api/auth/session/fetch';

const Header = () => {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      await fetchDeleteSession();
      router.replace('/login');
      router.refresh();
    } catch (error) {
      console.error('サインアウトに失敗しました:', error);
    }
  };

  return (
    <header className="flex h-15 w-full items-center justify-between border-b-2 border-zinc-200 p-3">
      <Link href={'/'}>
        <Image
          src={'/compass-logo-full.png'}
          alt="icon"
          width={150}
          height={50}
          className="h-auto"
          loading="eager"
        />
      </Link>

      <div className="h-full w-80">
        <input
          type="text"
          placeholder="search member"
          className="bg-gray-50 px-3 h-full w-full rounded-sm border border-zinc-200"
        />
      </div>

      <div className="flex items-center justify-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200"></div>

        {/* <Image
            src={user.photoURL!}
            alt="userImg"
            className="rounded-full"
            width={40}
            height={40}
          /> */}

        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-[#254f8f]/30 hover:bg-[#254f8f]/5 hover:text-[#254f8f]"
          >
            <FiLogOut aria-hidden="true" className="size-4" />
            サインアウト
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
