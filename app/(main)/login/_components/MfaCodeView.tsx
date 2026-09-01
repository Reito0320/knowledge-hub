'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiArrowLeft, FiLock, FiShield } from 'react-icons/fi';

const MfaCodeView = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  const handleCodeChange = (value: string) => {
    // 認証アプリのコードは数字6桁なので、数字以外を取り除く。
    const numericCode = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericCode);
    setError('');
  };

  const handleConfirmMfa = async (
    event: React.SubmitEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (code.length !== 6) {
      setError('認証アプリに表示された6桁のコードを入力してください。');
      return;
    }

    setError('');
    setIsConfirming(true);

    try {
      // TODO: Cognito MFAを実装するときに、以下の処理を追加する。
      // 1. aws-amplify/authからconfirmSignInをimportする。
      // 2. confirmSignIn({ challengeResponse: code })を実行する。
      // 3. result.isSignedInがtrueならCognitoのAccess Tokenを取得する。
      // 4. 既存のUser作成・自前Session作成処理を呼び、Homeへ遷移する。
      console.log('Cognitoへ送信するMFAコード:', code);
    } catch (confirmError) {
      console.error(confirmError);
      setError('コードを確認できませんでした。もう一度お試しください。');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#F7F6F3] font-inter text-[#454A52] md:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#1E3A5F] via-[#334B62] to-[#8A5938] p-14 text-white md:flex">
        <div />

        <div className="relative z-10 mt-10 max-w-sm">
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <FiShield className="size-6" aria-hidden="true" />
          </span>

          <h1 className="font-sora text-3xl leading-snug font-bold">
            もう一段階の確認で、
            <br />
            アカウントを守ります。
          </h1>
          <p className="mt-3.5 text-sm leading-relaxed text-white/80">
            パスワードに加えて認証アプリのコードを確認し、安全に社内ナレッジへアクセスします。
          </p>

          <div className="mt-9 flex flex-col gap-3.5 text-[13.5px] text-white/90">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7CC9A0]" />
              認証アプリを開いてコードを確認
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F2A465]" />
              表示された6桁のコードを入力
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              コードは一定時間ごとに更新
            </div>
          </div>
        </div>

        <svg
          className="pointer-events-none absolute -right-24 -bottom-24 opacity-90"
          width="340"
          height="340"
          viewBox="0 0 200 200"
          aria-hidden="true"
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

      <section className="flex items-center justify-center bg-[#F7F6F3] px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-[#A66334]/10 text-[#A66334] md:hidden">
            <FiShield className="size-6" aria-hidden="true" />
          </span>

          <p className="mb-2 text-xs font-bold tracking-[0.14em] text-[#A66334] uppercase">
            Two-factor authentication
          </p>
          <h2 className="font-sora text-2xl font-bold text-[#454A52]">
            本人確認
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#7B8899]">
            認証アプリに表示されている6桁のコードを入力してください。
          </p>

          <form className="mt-7" onSubmit={handleConfirmMfa}>
            <label
              htmlFor="mfaCode"
              className="mb-1.5 block text-xs font-semibold text-[#57534F]"
            >
              認証コード
            </label>
            <div className="relative">
              <FiLock
                className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-[#A99A8F]"
                aria-hidden="true"
              />
              <input
                id="mfaCode"
                name="mfaCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => handleCodeChange(event.target.value)}
                placeholder="000000"
                maxLength={6}
                required
                autoFocus
                aria-describedby="mfaCodeHelp"
                aria-invalid={Boolean(error)}
                className="w-full rounded-[10px] border border-[#DED4CA] bg-white py-3 pr-4 pl-11 text-center text-xl font-semibold tracking-[0.35em] outline-none transition placeholder:text-[#C8C0B8] focus:border-[#A66334] focus:ring-2 focus:ring-[#A66334]/15"
              />
            </div>
            <p
              id="mfaCodeHelp"
              className="mt-2 text-xs leading-relaxed text-[#8A8178]"
            >
              コードが切り替わった場合は、新しく表示されたコードを入力してください。
            </p>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-[10px] border border-red-100 bg-red-50 px-3.5 py-3 text-xs leading-relaxed text-red-700"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isConfirming || code.length !== 6}
              className="mt-6 w-full rounded-[10px] bg-[#A66334] py-3 text-[14.5px] font-bold text-white transition hover:bg-[#86502D] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isConfirming ? '確認中...' : '確認してログイン'}
            </button>
          </form>

          <Link
            href="/login"
            className="mt-5 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#A66334] transition hover:text-[#86502D] hover:underline"
          >
            <FiArrowLeft aria-hidden="true" />
            ログイン画面へ戻る
          </Link>

          <div className="mt-7 flex gap-2 rounded-[10px] bg-[#FCF7F2] p-3.5 text-xs leading-relaxed text-[#756C64]">
            <FiShield className="mt-0.5 size-4 shrink-0 text-[#A66334]" aria-hidden="true" />
            認証アプリを利用できない場合は、情シス担当者へお問い合わせください。
          </div>
        </div>
      </section>
    </main>
  );
};

export default MfaCodeView;
