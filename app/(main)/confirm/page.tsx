'use client';

import { resendSignUpCode } from 'aws-amplify/auth';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { cognitoConfirm, getErrorMessage } from './confirm';

const ConfirmForm = () => {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleConfirm = async (event: React.ChangeEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = sessionStorage.getItem('signupEmail');

    if (!email)
      return setError(
        'メールアドレスが見つかりません。新規登録からやり直してください。',
      );

    setError('');
    setNotice('');
    setIsConfirming(true);

    try {
      const result = await cognitoConfirm(email, code);
      if (result.isSignUpComplete) {
        sessionStorage.removeItem('signupEmail');
        router.replace('/login?confirmed=1');
        return;
      }

      setError('アカウント確認を完了できませんでした。');
    } catch (confirmError) {
      setError(getErrorMessage(confirmError));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleResend = async () => {
    const email = sessionStorage.getItem('signupEmail');

    if (!email)
      return setError(
        'メールアドレスが見つかりません。新規登録からやり直してください。',
      );

    setError('');
    setNotice('');
    setIsResending(true);

    try {
      await resendSignUpCode({ username: email });
      setNotice('確認コードを再送しました。メールをご確認ください。');
    } catch (resendError) {
      setError(getErrorMessage(resendError));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 flex items-center gap-2.5 font-sora text-lg font-extrabold md:hidden" />

      <h2 className="font-sora text-2xl font-bold text-[#454A52]">メールアドレスの確認</h2>
      <p className="mb-7 mt-1.5 text-sm leading-relaxed text-[#7B8899]">
        登録したメールアドレスに確認コードを送信しました。
        <br />
        メールに記載されたコードを入力してください。
      </p>

      <form onSubmit={handleConfirm}>
        <div className="mb-4">
          <label
            htmlFor="confirmationCode"
            className="mb-1.5 block text-xs font-semibold text-[#57534F]"
          >
            確認コード
          </label>
          <input
            id="confirmationCode"
            name="confirmationCode"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="123456"
            maxLength={6}
            required
            autoFocus
            className="w-full rounded-[10px] border border-[#DED4CA] bg-white px-3.5 py-3 text-center text-xl tracking-[0.35em] outline-none transition focus:border-[#A66334] focus:ring-2 focus:ring-[#A66334]/15"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-[10px] bg-red-50 px-3.5 py-3 text-xs leading-relaxed text-red-700"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mb-4 rounded-[10px] bg-emerald-50 px-3.5 py-3 text-xs leading-relaxed text-emerald-700"
          >
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={isConfirming || code.trim().length === 0}
          className="w-full rounded-[10px] bg-[#A66334] py-3 text-[14.5px] font-bold text-white transition hover:bg-[#86502D] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isConfirming ? '確認中...' : 'アカウントを確認'}
        </button>
      </form>

      <div className="mt-6 text-center text-[13px] text-[#7B8899]">
        コードが届きませんか？
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="ml-1 font-semibold text-[#A66334] hover:text-[#86502D] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isResending ? '再送中...' : '確認コードを再送'}
        </button>
      </div>

      <div className="mt-5 text-center text-[13px]">
        <Link
          href="/signup"
          className="font-medium text-[#A66334] hover:text-[#86502D] hover:underline"
        >
          メールアドレスを変更する
        </Link>
      </div>

      <div className="mt-7 flex gap-2 rounded-[10px] bg-[#FCF7F2] p-3.5 text-xs leading-relaxed text-[#756C64]">
        🛡️ 確認コードの有効期限が切れた場合は、新しいコードを再送してください。
      </div>
    </div>
  );
};

const ConfirmPage = () => {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#F7F6F3] font-inter text-[#454A52] md:grid-cols-2">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#1E3A5F] via-[#334B62] to-[#8A5938] p-14 text-white md:flex">
        <div className="flex items-center gap-2.5 font-sora text-lg font-extrabold" />

        <div className="mt-10 max-w-sm">
          <h1 className="font-sora text-3xl font-bold leading-snug">
            あと少しで、
            <br />
            登録が完了します。
          </h1>
          <p className="mt-3.5 text-sm leading-relaxed text-white/80">
            メールアドレスを確認して、安全に社内ナレッジへアクセスしましょう。
          </p>

          <div className="mt-9 flex flex-col gap-3.5 text-[13.5px] text-white/90">
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#7CC9A0]" />
              メールで届いた6桁の確認コードを入力
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-[#F2A465]" />
              コードが届かない場合はいつでも再送可能
            </div>
            <div className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 rounded-full bg-white" />
              確認完了後、ログイン画面へ移動
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

      <section className="flex items-center justify-center bg-[#F7F6F3] p-10">
        <ConfirmForm />
      </section>
    </main>
  );
};

export default ConfirmPage;
