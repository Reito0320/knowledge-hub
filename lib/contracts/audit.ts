export const actionLabels = {
  MFA_TOTP_RESET: 'MFA救済',
  USER_ROLE_CHANGED: '権限変更',
  USER_STATUS_CHANGED: '利用状態変更',
  USER_SESSION_REVOKED: 'セッション失効',
  DEPARTMENT_CREATED: '部署追加',
  DEPARTMENT_RENAMED: '部署名変更',
  DEPARTMENT_DELETED: '部署削除',
} as const;

export const statusLabels = {
  PENDING: '処理中',
  SUCCEEDED: '成功',
  FAILED: '失敗',
} as const;

export type AdminAuditAction = keyof typeof actionLabels;
export type AdminAuditStatus = keyof typeof statusLabels;
