'use client';

import { useState } from 'react';
import {
  FiArrowLeft,
  FiCheck,
  FiGrid,
  FiKey,
  FiShield,
  FiSmartphone,
} from 'react-icons/fi';

type MfaSetupViewProps = {
  setupUri: string;
  onBack: () => void;
};

const MfaSetupView = ({ setupUri, onBack }: MfaSetupViewProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);

  // TODO: Cognitoから受け取ったtotpSetupDetailsを状態として保持する。
  // const [setupUri, setSetupUri] = useState('');
  // const [sharedSecret, setSharedSecret] = useState('');

  const handleCodeChange = (value: string) => {
    const numericCode = value.replace(/\D/g, '').slice(0, 6);
    setCode(numericCode);
    setError('');
  };

  const handleCompleteSetup = async (
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
      // TODO: Cognito MFAを実装するときに、以下の処理へ置き換える。
      // 1. signIn()のnextStepがCONTINUE_SIGN_IN_WITH_TOTP_SETUPか確認する。
      // 2. nextStep.totpSetupDetails.getSetupUri('Knowledge-Hub')からQRコードを作る。
      // 3. このフォームで入力されたcodeをconfirmSignIn({ challengeResponse: code })へ渡す。
      // 4. 認証完了後にAccess Tokenを取得し、既存のUser作成・Session作成処理を呼ぶ。
      console.log('Cognitoへ送信する初回MFAコード:', code);
    } catch (setupError) {
      console.error(setupError);
      setError('MFAを登録できませんでした。コードを確認してください。');
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <main className="grid min-h-screen grid-cols-1 bg-[#F7F6F3] font-inter text-[#454A52] lg:grid-cols-[minmax(320px,0.85fr)_minmax(560px,1.15fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-linear-to-br from-[#1E3A5F] via-[#334B62] to-[#8A5938] p-14 text-white lg:flex">
        <div />

        <div className="relative z-10 mt-10 max-w-sm">
          <span className="mb-5 flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
            <FiShield className="size-6" aria-hidden="true" />
          </span>
          <h1 className="font-sora text-3xl leading-snug font-bold">
            認証アプリを登録して、
            <br />
            安全なログインを始めます。
          </h1>
          <p className="mt-3.5 text-sm leading-relaxed text-white/80">
            初回だけの設定です。次回以降は認証アプリに表示されるコードを入力してログインします。
          </p>

          <ol className="mt-9 flex flex-col gap-4 text-[13.5px] text-white/90">
            {[
              '認証アプリをスマートフォンへ用意',
              'QRコードを認証アプリで読み取る',
              '表示された6桁のコードで登録を確認',
            ].map((label, index) => (
              <li key={label} className="flex items-center gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/12 text-xs font-bold">
                  {index + 1}
                </span>
                {label}
              </li>
            ))}
          </ol>
        </div>

        <svg
          className="pointer-events-none absolute -right-24 -bottom-24 opacity-90"
          width="340"
          height="340"
          viewBox="0 0 200 200"
          aria-hidden="true"
        >
          <circle cx="100" cy="100" r="90" fill="none" stroke="#fff" strokeOpacity="0.15" />
          <circle cx="100" cy="100" r="70" fill="none" stroke="#fff" strokeOpacity="0.15" />
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

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:py-14">
        <div className="w-full max-w-2xl">
          <div className="mb-7">
            <p className="mb-2 text-xs font-bold tracking-[0.14em] text-[#A66334] uppercase">
              MFA setup
            </p>
            <h2 className="font-sora text-2xl font-bold text-[#454A52]">
              認証アプリの初回登録
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-[#7B8899]">
              QRコードを読み取ったあと、認証アプリに表示されたコードで登録を完了します。
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <section className="rounded-2xl border border-[#DED4CA] bg-white p-5 shadow-[0_12px_35px_rgba(88,68,50,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#1E3A5F]/8 text-[#1E3A5F]">
                  <FiSmartphone aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#A66334]">STEP 1</p>
                  <h3 className="text-sm font-bold text-[#454A52]">
                    QRコードを読み取る
                  </h3>
                </div>
              </div>

              <div className="mx-auto flex aspect-square w-full max-w-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#D8CEC4] bg-[#FCFAF7] text-center">
                <FiGrid className="size-10 text-[#A99A8F]" aria-hidden="true" />
                <p className="mt-3 text-xs font-semibold text-[#756C64]">
                  QRコード表示エリア
                </p>
                <p className="mt-1 px-5 text-[11px] leading-relaxed text-[#9A9087]">
                  {setupUri
                    ? 'QRコードライブラリ接続後に表示されます'
                    : 'セットアップ情報を準備しています'}
                </p>
              </div>

              <div className="mt-5 rounded-xl bg-[#FCF7F2] p-3.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#57534F]">
                  <FiKey className="text-[#A66334]" aria-hidden="true" />
                  読み取れない場合
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-[#7B7169]">
                  Cognitoから取得したセットアップキーを、認証アプリへ手動で入力できるようにします。
                </p>
                {/* TODO: sharedSecret取得後、コピー可能なキーとコピーボタンをここへ表示する。 */}
              </div>
            </section>

            <section className="rounded-2xl border border-[#DED4CA] bg-white p-5 shadow-[0_12px_35px_rgba(88,68,50,0.06)]">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-9 items-center justify-center rounded-xl bg-[#A66334]/10 text-[#A66334]">
                  <FiCheck aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-bold text-[#A66334]">STEP 2</p>
                  <h3 className="text-sm font-bold text-[#454A52]">
                    登録を確認する
                  </h3>
                </div>
              </div>

              <p className="mb-5 text-xs leading-relaxed text-[#7B8899]">
                認証アプリへ「Knowledge-Hub」が追加されたら、表示された6桁のコードを入力してください。
              </p>

              <form onSubmit={handleCompleteSetup}>
                <label
                  htmlFor="setupMfaCode"
                  className="mb-1.5 block text-xs font-semibold text-[#57534F]"
                >
                  認証コード
                </label>
                <input
                  id="setupMfaCode"
                  name="setupMfaCode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  onChange={(event) => handleCodeChange(event.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  required
                  aria-invalid={Boolean(error)}
                  className="w-full rounded-[10px] border border-[#DED4CA] bg-white px-4 py-3 text-center text-xl font-semibold tracking-[0.35em] outline-none transition placeholder:text-[#C8C0B8] focus:border-[#A66334] focus:ring-2 focus:ring-[#A66334]/15"
                />

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
                  className="mt-5 w-full rounded-[10px] bg-[#A66334] py-3 text-[14.5px] font-bold text-white transition hover:bg-[#86502D] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isConfirming ? '登録を確認中...' : 'MFAを登録してログイン'}
                </button>
              </form>

              <div className="mt-5 flex gap-2 rounded-[10px] bg-[#F3F5F7] p-3.5 text-xs leading-relaxed text-[#66717D]">
                <FiShield className="mt-0.5 size-4 shrink-0 text-[#1E3A5F]" aria-hidden="true" />
                登録後は認証アプリを削除しないでください。端末を変更する場合は、先に情シスへご相談ください。
              </div>
            </section>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="mt-6 flex items-center justify-center gap-1.5 text-[13px] font-semibold text-[#A66334] transition hover:text-[#86502D] hover:underline"
          >
            <FiArrowLeft aria-hidden="true" />
            ログイン画面へ戻る
          </button>
        </div>
      </section>
    </main>
  );
};

export default MfaSetupView;
