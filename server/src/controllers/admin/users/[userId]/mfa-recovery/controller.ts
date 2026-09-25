import { AdminOnly } from '@/server/src/auth/auth.decorators';
import { Bind, Controller, Post } from '@nestjs/common';
import { WebRequest, WebParams } from '@/server/src/http/web-request';
import { adminDeleteSoftwareToken } from '@/server/src/infrastructure/aws/admin-delete-software-token';
import { adminUserGlobalSignOut } from '@/server/src/infrastructure/aws/admin-user-global-sign-out';
import { getCurrentAdmin } from '@/server/src/auth/request-user';
import { prisma } from '@/server/src/infrastructure/prisma';

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
  request: Request,
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

@AdminOnly()
@Controller('admin/users/:userId/mfa-recovery')
export class AdminUsersUseridMfaRecoveryController {
  @Post()
  @Bind(WebRequest(), WebParams())
  async POST(
    request: Request,
    context: { params: Promise<{ userId: string }> },
  ) {
    try {
      const admin = await getCurrentAdmin();
      if (!admin) {
        return Response.json(
          { message: '管理者権限が必要です。' },
          { status: 403 },
        );
      }

      const { userId } = await context.params;
      if (!userId) {
        return Response.json(
          { message: 'MFA救済対象のユーザーを確認できませんでした。' },
          { status: 400 },
        );
      }

      const requestBody = await readMfaRecoveryRequest(request);
      if (!requestBody) {
        return Response.json(
          { message: 'リクエストの形式が正しくありません。' },
          { status: 400 },
        );
      }

      if (!requestBody.isIdentityVerified) {
        return Response.json(
          { message: '本人確認が完了していません。' },
          { status: 400 },
        );
      }

      if (!requestBody.reason) {
        return Response.json(
          { message: 'MFA救済処置の実行理由を入力してください。' },
          { status: 400 },
        );
      }

      if (requestBody.reason.length > 500) {
        return Response.json(
          { message: '実行理由は500文字以内で入力してください。' },
          { status: 400 },
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true },
      });

      if (!targetUser) {
        return Response.json(
          { message: 'MFA救済対象のユーザーが存在しません。' },
          { status: 404 },
        );
      }

      if (targetUser.role !== 'MEMBER') {
        return Response.json(
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
        await adminUserGlobalSignOut(targetUser.id);
      } catch (error) {
        const errorMessage = getErrorMessage(error).slice(0, 1000);
        await completeAuditLog(auditLog.id, 'FAILED', errorMessage);
        console.error('CognitoのTOTP登録を削除できませんでした:', error);

        const errorName = getErrorName(error);
        if (errorName === 'UserNotFoundException') {
          return Response.json(
            { message: 'Cognitoに対象ユーザーが存在しません。' },
            { status: 404 },
          );
        }

        if (errorName === 'ResourceNotFoundException') {
          return Response.json(
            { message: '削除できるTOTP設定が見つかりませんでした。' },
            { status: 409 },
          );
        }

        if (errorName === 'TooManyRequestsException') {
          return Response.json(
            { message: '操作が集中しています。時間をおいて再実行してください。' },
            { status: 429 },
          );
        }

        return Response.json(
          { message: 'CognitoのMFA設定を変更できませんでした。' },
          { status: 502 },
        );
      }

      await completeAuditLog(auditLog.id, 'SUCCEEDED');

      return Response.json({
        message: 'MFAを再設定できる状態にしました。',
      });
    } catch (error) {
      console.error('MFA救済処置で予期しないエラーが発生しました:', error);
      return Response.json(
        { message: 'MFA救済処置を完了できませんでした。' },
        { status: 500 },
      );
    }

  }
}
