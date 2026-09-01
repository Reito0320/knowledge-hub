'use client';

import { FcGoogle } from 'react-icons/fc';
import { handleLogin } from './login';
import { notifyAuthSessionChanged } from '@/lib/auth/auth-session-event';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const LoginPage = () => {
  const router = useRouter();

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#F7F6F3] font-inter text-[#454A52] md:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#1E3A5F] via-[#334B62] to-[#8A5938] p-14 text-white md:flex">
        {/* Left: brand / security panel */}
        <div className="flex items-center gap-2.5 font-sora text-lg font-extrabold"></div>

        <div className="mt-10 max-w-sm">
          <h1 className="font-sora text-3xl font-bold leading-snug">
            知りたいことは、
            <br />
            いつも誰かが知っている。
          </h1>
          <p className="mt-3.5 text-sm leading-relaxed text-white/80">
            社内のナレッジと「誰に聞けばいいか」が一目でわかる、社内限定のナレッジハブです。
          </p>

          <div className="mt-9 flex flex-col gap-3.5 text-[13.5px] text-white/90">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7CC9A0]" />
              分野ごとの得意なメンバーが自動で表示される
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F2A465]" />
              過去の質問・回答をいつでも検索できる
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              アクセスは社内ネットワークに限定・全操作を記録
            </div>
          </div>
        </div>

        {/* decorative ring, bottom-right */}
        <svg
          className="pointer-events-none absolute -bottom-24 -right-24 opacity-90"
          width="340"
          height="340"
          viewBox="0 0 200 200"
        >
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.15"
          />
          <circle
            cx="100"
            cy="100"
            r="70"
            fill="none"
            stroke="#fff"
            strokeOpacity="0.15"
          />
          <circle
            cx="100"
            cy="100"
            r="78"
            fill="none"
            stroke="#fff"
            strokeWidth="16"
            strokeOpacity="0.25"
            strokeDasharray="153 337"
            transform="rotate(-90 100 100)"
          />
        </svg>

        <div className="relative z-10 text-xs text-white/55">
          © 2026 Compass Internal Tool — Employees Only
        </div>
      </section>

      {/* Right: form panel */}
      <section className="flex items-center justify-center bg-[#F7F6F3] p-10">
        <div className="w-full max-w-sm">
          {/* mobile-only brand */}
          <div className="mb-6 flex items-center gap-2.5 font-sora text-lg font-extrabold md:hidden"></div>

          <h2 className="font-sora text-2xl font-bold text-[#454A52]">ログイン</h2>
          <p className="mb-7 mt-1.5 text-sm text-[#7B8899]">
            作成した社内専用アカウントにログインします
          </p>

          <form
            onSubmit={async (e) => {
              try {
                const isLoggedIn = await handleLogin(e);

                if (!isLoggedIn) return;
              } catch (error) {
                console.error(error);
                return;
              }
              notifyAuthSessionChanged();
              router.replace('/');
              router.refresh();
            }}
          >
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-[#57534F]"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="yamada@company.co.jp"
                className="w-full rounded-[10px] border border-[#DED4CA] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#A66334] focus:ring-2 focus:ring-[#A66334]/15"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-[#57534F]"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••••"
                className="w-full rounded-[10px] border border-[#DED4CA] bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#A66334] focus:ring-2 focus:ring-[#A66334]/15"
              />
            </div>

            <div className="mb-6 flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-1.5 text-[#7B8899]">
                <input
                  type="checkbox"
                  // checked={remember}
                  // onChange={(e) => setRemember(e.target.checked)}
                  className="accent-[#A66334]"
                />
                ログイン状態を保持
              </label>
              <a
                href="#"
                className="font-medium text-[#A66334] hover:text-[#86502D] hover:underline"
              >
                パスワードを忘れた方
              </a>
            </div>

            <button
              type="submit"
              className="w-full rounded-[10px] bg-[#A66334] py-3 text-[14.5px] font-bold text-white transition hover:bg-[#86502D]"
            >
              ログイン
            </button>
          </form>

          <p className="mt-5 text-center text-[13px] text-[#7B8899]">
            アカウントをお持ちでない方は
            <Link
              href="/signup"
              className="ml-1 font-bold text-[#A66334] hover:text-[#86502D] hover:underline"
            >
              新規登録
            </Link>
          </p>

          <div className="my-6 flex items-center gap-3 text-xs text-[#8A8178]">
            <span className="h-px flex-1 bg-[#DED4CA]" />
            または
            <span className="h-px flex-1 bg-[#DED4CA]" />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-[#DED4CA] bg-white py-2.5 text-[13.5px] font-semibold text-[#57534F] transition hover:border-[#C88A5B] hover:bg-[#FFF8F1]"
          >
            <FcGoogle className="size-5" />
            Google Login
          </button>

          <div className="mt-7 flex gap-2 rounded-[10px] bg-[#FCF7F2] p-3.5 text-xs text-[#756C64]">
            🛡️
            ログイン情報はすべて暗号化され、アクセス履歴は監査ログとして記録されます。不明な点は情シスまでご連絡ください。
          </div>
        </div>
      </section>
    </main>
  );
};

export default LoginPage;
