import { readJsonResponse } from '@/lib/http/read-json-response';

type MfaRecoveryResponse = {
  message?: string;
};

export const fetchPostMFAAdminRecovery = async (
  userId: string,
  isIdentityVerified: boolean,
  reason: string,
) => {
  const res = await fetch(`/api/admin/users/${userId}/mfa-recovery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isIdentityVerified, reason }),
  });
  const body = await readJsonResponse<MfaRecoveryResponse>(res);

  if (!res.ok) {
    const errorMessage =
      body.message || 'MFA救済処置の通信が失敗しています。';
    throw new Error(errorMessage);
  }

  return body.message || 'MFAを再設定できる状態にしました。';
};
