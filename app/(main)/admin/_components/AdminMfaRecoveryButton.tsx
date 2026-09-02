'use client';

import { fetchPostMFAAdminRecovery } from '@/app/api/admin/users/[userId]/mfa-recovery/fetch';
import { useState } from 'react';
import { FiAlertTriangle, FiKey, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';

type AdminMfaRecoveryButtonProps = {
  userId: string;
  userName: string;
  userEmail: string;
};

const AdminMfaRecoveryButton = ({
  userId,
  userName,
  userEmail,
}: AdminMfaRecoveryButtonProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isIdentityVerified, setIsIdentityVerified] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const closeModal = () => {
    if (isSubmitting) return;

    setIsOpen(false);
    setIsIdentityVerified(false);
    setReason('');
  };

  const handleRecovery = async () => {
    /*
     * TODO: CognitoのMFA救済APIを実装したら、ここから呼び出す。
     *
     * 想定するサーバー側の流れ
     * 1. POST /api/admin/users/[userId]/mfa-recovery を作る。
     * 2. getCurrentAdmin()で、実行者がACTIVEなADMINか再検証する。
     * 3. userIdから対象ユーザーを取得し、Cognitoで使うUsernameを確定する。
     * 4. AWS SDK v3のAdminDeleteSoftwareTokenCommandをサーバー側で実行する。
     *    入力にはUserPoolIdと対象ユーザーのUsernameを渡す。
     * 5. 必要に応じて自前Sessionも無効化し、次回ログイン時にTOTPを再登録させる。
     * 6. 管理者ID・対象ユーザーID・reason・実行日時を監査ログへ保存する。
     *
     * AWS認証情報やAdminDeleteSoftwareTokenCommandはブラウザ側へ置かない。
     */
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const message = await fetchPostMFAAdminRecovery(
        userId,
        isIdentityVerified,
        reason,
      );
      toast.success(message);
      setIsOpen(false);
      setIsIdentityVerified(false);
      setReason('');
    } catch (error) {
      console.error(error);
      let errorMessage = 'MFA救済設定に失敗しました。';
      if (error instanceof Error) errorMessage = error.message;
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit =
    isIdentityVerified && reason.trim().length > 0 && !isSubmitting;

  return (
    <>
      <button
        type="button"
        data-user-id={userId}
        onClick={() => setIsOpen(true)}
        className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#DDCDBF] bg-white px-3 text-xs font-bold text-[#8D5B39] transition hover:border-[#B67A50] hover:bg-[#FFF8F1]"
      >
        <FiKey aria-hidden="true" />
        MFA救済
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center bg-[#2F2924]/45 px-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="mfa-recovery-title"
            className="w-full max-w-lg rounded-3xl border border-[#E5D9CE] bg-[#FFFDFC] p-6 shadow-[0_24px_70px_rgba(47,41,36,0.24)] sm:p-7"
          >
            <header className="flex items-start justify-between gap-4">
              <div className="flex gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#F8E8DB] text-[#A55F35]">
                  <FiKey aria-hidden="true" className="size-5" />
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#A66334]">
                    MFA recovery
                  </p>
                  <h2
                    id="mfa-recovery-title"
                    className="mt-1 text-xl font-bold text-[#3F4854]"
                  >
                    TOTP端末紛失の救済
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                aria-label="MFA救済画面を閉じる"
                className="flex size-9 items-center justify-center rounded-full text-[#817970] transition hover:bg-[#F4ECE5]"
              >
                <FiX aria-hidden="true" />
              </button>
            </header>

            <div className="mt-6 rounded-2xl border border-[#E8DED5] bg-white p-4">
              <p className="font-bold text-[#3F4854]">{userName}</p>
              <p className="mt-1 text-sm text-[#817970]">{userEmail}</p>
            </div>

            <div className="mt-4 flex gap-3 rounded-2xl border border-[#E8CFB7] bg-[#FFF8ED] p-4 text-sm leading-6 text-[#79563D]">
              <FiAlertTriangle
                aria-hidden="true"
                className="mt-1 size-4 shrink-0"
              />
              <p>
                実行後は現在の認証アプリで生成したコードを使えなくし、次回ログイン時に新しいTOTP設定を案内する想定です。
              </p>
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-xl border border-[#E8E0D8] p-4 text-sm text-[#625D58]">
              <input
                type="checkbox"
                checked={isIdentityVerified}
                onChange={(event) =>
                  setIsIdentityVerified(event.target.checked)
                }
                className="mt-0.5 size-4 accent-[#A66334]"
              />
              社員証や社内連絡など、別経路で本人確認を完了しました
            </label>

            <label className="mt-4 block">
              <span className="text-sm font-bold text-[#4B4E54]">対応理由</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={isSubmitting}
                maxLength={500}
                rows={3}
                placeholder="例：社用スマートフォンの紛失を本人と上長へ確認済み"
                className="mt-2 w-full resize-none rounded-xl border border-[#DDD5CD] bg-white px-3 py-2.5 text-sm text-[#3F4854] outline-none transition placeholder:text-[#AAA099] focus:border-[#B26936] focus:ring-3 focus:ring-[#B26936]/10"
              />
            </label>

            <footer className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="h-10 rounded-xl border border-[#DDD5CD] px-4 text-sm font-bold text-[#687482] transition hover:bg-[#F7F3EF]"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleRecovery}
                className="h-10 rounded-xl bg-[#A3544E] px-5 text-sm font-bold text-white transition hover:bg-[#88433E] disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSubmitting ? '実行中…' : 'MFA救済を実行'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
};

export default AdminMfaRecoveryButton;
