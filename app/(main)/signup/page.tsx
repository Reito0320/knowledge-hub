'use client';

import { useRouter } from 'next/navigation';
import { FcGoogle } from 'react-icons/fc';
import { handleSignup } from './signup';
import { useState } from 'react';

const SingUpPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleConfirm = async (e: React.SubmitEvent<HTMLFormElement>) => {
    setIsLoading(true);
    // formアクションの際にデフォルトでリロードされるのを防ぐ
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const signup = await handleSignup(name, email, password);
    if (!signup) return;
    setIsLoading(false);
    window.alert(`${email} 当てに送られている認証コードを確認してください。`);
    router.push('/confirm');
  };
  return (
    <main className="grid min-h-screen grid-cols-1 md:grid-cols-2 font-inter text-compass-ink bg-compass-bg">
      {/* Left: brand / security panel */}
      <section className="relative hidden md:flex flex-col justify-between overflow-hidden bg-gradient-to-br from-[#1E3A5F] via-[#234A78] to-compass-blue p-14 text-white">
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
      <section className="flex items-center justify-center p-10 bg-gray-50">
        <div className="w-full max-w-sm">
          {/* mobile-only brand */}
          <div className="mb-6 flex items-center gap-2.5 font-sora text-lg font-extrabold md:hidden"></div>

          <h2 className="font-sora text-2xl font-bold">新規登録</h2>
          <p className="mb-7 mt-1.5 text-sm text-compass-muted">
            社内専用アカウントを作成します
          </p>

          <form onSubmit={(e) => handleConfirm(e)}>
            <div className="mb-4">
              <label
                htmlFor="name"
                className="mb-1.5 block text-xs font-semibold text-compass-ink"
              >
                ニックネーム
              </label>
              <input
                id="name"
                type="text"
                name="name"
                placeholder="山田 太郎"
                className="w-full rounded-[10px] border border-compass-border bg-white px-3.5 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1.5 block text-xs font-semibold text-compass-ink"
              >
                メールアドレス
              </label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="yamada@company.co.jp"
                className="w-full rounded-[10px] border border-compass-border bg-white px-3.5 py-2.5 text-sm outline-none"
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="password"
                className="mb-1.5 block text-xs font-semibold text-compass-ink"
              >
                パスワード
              </label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••••"
                minLength={8}
                className="w-full rounded-[10px] border border-compass-border bg-white px-3.5 py-2.5 text-sm outline-none"
              />
              <span className="text-gray-400 text-sm">
                8文字以上・大文字・小文字・数字・記号を含めてください
              </span>
            </div>

            <div className="mb-6 flex items-center justify-between text-[13px]">
              <label className="flex items-center gap-1.5 text-compass-muted">
                <input
                  type="checkbox"
                  // checked={remember}
                  // onChange={(e) => setRemember(e.target.checked)}
                  className="accent-compass-blue"
                />
                ログイン状態を保持
              </label>
              <a
                href="#"
                className="font-medium text-compass-blue hover:underline"
              >
                パスワードを忘れた方
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full rounded-[10px] bg-compass-blue py-3 text-[14.5px] font-bold text-white transition hover:opacity-70 ${isLoading ? 'bg-gray-500' : 'bg-[#254f8f]'}`}
            >
              {isLoading ? 'Loading' : '新規登録'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-compass-muted">
            <span className="h-px flex-1 bg-compass-border" />
            または
            <span className="h-px flex-1 bg-compass-border" />
          </div>

          <button
            type="button"
            className="flex w-full items-center justify-center gap-2.5 rounded-[10px] border border-compass-border bg-white py-2.5 text-[13.5px] font-semibold text-compass-ink transition hover:opacity-70"
          >
            <FcGoogle className="size-5" />
            Google Singup
          </button>

          <div className="mt-7 flex gap-2 rounded-[10px] bg-compass-bg p-3.5 text-xs text-compass-muted">
            🛡️
            ログイン情報はすべて暗号化され、アクセス履歴は監査ログとして記録されます。不明な点は情シスまでご連絡ください。
          </div>
        </div>
      </section>
    </main>
  );
};

export default SingUpPage;

/* Object
isSignUpComplete
: 
false
nextStep
: 
codeDeliveryDetails
: 
attributeName
: 
"email"
deliveryMedium
: 
"EMAIL"
destination
: 
"r***@c***"
[[Prototype]]
: 
Object
signUpStep
: 
"CONFIRM_SIGN_UP"
[[Prototype]]
: 
Object
userId
: 
"9754ca98-90d1-703f-9d79-d27781b43d88"
[[Prototype]]
: 
Object */
