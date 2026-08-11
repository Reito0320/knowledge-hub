'use client';

import { auth } from '@/lib/auth';
import { onAuthStateChanged, User } from 'firebase/auth';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FcGoogle } from 'react-icons/fc';

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const isLogin = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });
    return isLogin;
  }, []);

  return (
    <header className="flex items-center justify-between p-3 h-15 w-full border-b-2 border-zinc-200 ">
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

      {isLoading && (
        <div className="flex items-center justify-center rounded-full h-10 w-10 bg-gray-200"></div>
      )}

      {!isLoading && user ? (
        <div className="flex items-center justify-center gap-2">
          <span className="text-gray-500">{user.displayName}</span>
          <Image
            src={user.photoURL!}
            alt="userImg"
            className="rounded-full"
            width={40}
            height={40}
          />
        </div>
      ) : (
        <div
          className="flex items-center justify-center gap-2 border p-2 rounded-sm border-zinc-200"
          // onClick={}
        >
          <FcGoogle className="size-5" />
          <p>Google Login</p>
        </div>
      )}
    </header>
  );
};

export default Header;
