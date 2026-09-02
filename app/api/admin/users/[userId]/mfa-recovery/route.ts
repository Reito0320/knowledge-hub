import { adminDeleteSoftwareToken } from '@/lib/AWS/admin-delete-software-token';
import { getCurrentAdmin } from '@/lib/auth/get-current-admin';
import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

type MfaRecoveryRequest = {
  isIdentityVerified: boolean;
  reason: string;
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return '詳細を取得できないエラーが発生しました。';
};

const getErrorName = (error: unknown) => {
  if (error instanceof Error) return error.name;
  return '';
};

/**
 * Cognito操作後に監査ログだけ更新できなかった場合でも、
 * TOTP削除を再実行させないため、更新エラーはここで記録して握る。
 */
const completeAuditLog = async (
  auditLogId: string,
  status: 'SUCCEEDED' | 'FAILED',
  errorMessage?: string,
) => {
  try {
    await prisma.adminAuditLog.update({
      where: { id: auditLogId },
      data: {
        status,
        errorMessage,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error('MFA救済の監査ログを更新できませんでした:', error);
  }
};

const readMfaRecoveryRequest = async (
  request: NextRequest,
): Promise<MfaRecoveryRequest | null> => {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return null;
  }

  if (typeof body !== 'object' || body === null) return null;
  if (!('isIdentityVerified' in body) || !('reason' in body)) return null;
  if (typeof body.isIdentityVerified !== 'boolean') return null;
  if (typeof body.reason !== 'string') return null;

  return {
    isIdentityVerified: body.isIdentityVerified,
    reason: body.reason.trim(),
  };
};

export const POST = async (
  request: NextRequest,
  context: RouteContext<'/api/admin/users/[userId]/mfa-recovery'>,
) => {
  try {
    const admin = await getCurrentAdmin();
    if (!admin) {
      return NextResponse.json(
        { message: '管理者権限が必要です。' },
        { status: 403 },
      );
    }

    const { userId } = await context.params;
    if (!userId) {
      return NextResponse.json(
        { message: 'MFA救済対象のユーザーを確認できませんでした。' },
        { status: 400 },
      );
    }

    const requestBody = await readMfaRecoveryRequest(request);
    if (!requestBody) {
      return NextResponse.json(
        { message: 'リクエストの形式が正しくありません。' },
        { status: 400 },
      );
    }

    if (!requestBody.isIdentityVerified) {
      return NextResponse.json(
        { message: '本人確認が完了していません。' },
        { status: 400 },
      );
    }

    if (!requestBody.reason) {
      return NextResponse.json(
        { message: 'MFA救済処置の実行理由を入力してください。' },
        { status: 400 },
      );
    }

    if (requestBody.reason.length > 500) {
      return NextResponse.json(
        { message: '実行理由は500文字以内で入力してください。' },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { message: 'MFA救済対象のユーザーが存在しません。' },
        { status: 404 },
      );
    }

    if (targetUser.role !== 'MEMBER') {
      return NextResponse.json(
        { message: 'MEMBERだけがMFA救済処置の対象です。' },
        { status: 403 },
      );
    }

    // Cognitoを操作する前に記録し、失敗した試行も監査できるようにする。
    const auditLog = await prisma.adminAuditLog.create({
      data: {
        action: 'MFA_TOTP_RESET',
        status: 'PENDING',
        adminUserId: admin.id,
        targetUserId: targetUser.id,
        reason: requestBody.reason,
      },
      select: { id: true },
    });

    try {
      await adminDeleteSoftwareToken(targetUser.id);
    } catch (error) {
      const errorMessage = getErrorMessage(error).slice(0, 1000);
      await completeAuditLog(auditLog.id, 'FAILED', errorMessage);
      console.error('CognitoのTOTP登録を削除できませんでした:', error);

      const errorName = getErrorName(error);
      if (errorName === 'UserNotFoundException') {
        return NextResponse.json(
          { message: 'Cognitoに対象ユーザーが存在しません。' },
          { status: 404 },
        );
      }

      if (errorName === 'ResourceNotFoundException') {
        return NextResponse.json(
          { message: '削除できるTOTP設定が見つかりませんでした。' },
          { status: 409 },
        );
      }

      if (errorName === 'TooManyRequestsException') {
        return NextResponse.json(
          { message: '操作が集中しています。時間をおいて再実行してください。' },
          { status: 429 },
        );
      }

      return NextResponse.json(
        { message: 'CognitoのMFA設定を変更できませんでした。' },
        { status: 502 },
      );
    }

    await completeAuditLog(auditLog.id, 'SUCCEEDED');

    /*
     * TODO: 既存セッション失効は別工程で実装する。
     * - Cognito: AdminUserGlobalSignOutCommandで対象ユーザーの既存トークンを無効化する。
     * - 自前Session: SessionをDB管理するかsessionVersionをUserへ持たせ、
     *   対象ユーザーの全Sessionをサーバー側から無効化できるようにする。
     * ブラウザのCookie削除だけでは、別端末のSessionまでは無効化できない点に注意する。
     */

    return NextResponse.json({
      message: 'MFAを再設定できる状態にしました。',
    });
  } catch (error) {
    console.error('MFA救済処置で予期しないエラーが発生しました:', error);
    return NextResponse.json(
      { message: 'MFA救済処置を完了できませんでした。' },
      { status: 500 },
    );
  }
};
