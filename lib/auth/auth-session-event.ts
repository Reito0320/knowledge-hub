export const AUTH_SESSION_CHANGED_EVENT =
  'knowledge-hub:auth-session-changed';

/** Root Layoutに残るHeaderへ、セッション再取得のタイミングを通知する。 */
export const notifyAuthSessionChanged = () => {
  window.dispatchEvent(new Event(AUTH_SESSION_CHANGED_EVENT));
};
