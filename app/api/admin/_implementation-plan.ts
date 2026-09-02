/*
 * 管理画面APIの実装メモ
 *
 * このファイルにはAPI処理を実装していません。
 * route.tsではないため、この設計メモ自体が公開APIになることはありません。
 * 実装を始める際は、機能単位で次のようにroute.tsを作成します。
 *
 * ユーザー一覧・検索                           管理画面のServer Componentで実装済み
 * app/api/admin/users/[userId]/role/route.ts   管理者権限の付与・解除（実装済み）
 * app/api/admin/users/[userId]/status/route.ts 承認・利用停止・再開（実装済み）
 * app/api/admin/users/[userId]/mfa/route.ts    CognitoのTOTP登録解除
 * app/api/admin/users/[userId]/session/route.ts 全端末のセッション失効
 * app/api/admin/audit-logs/route.ts            管理操作履歴の取得
 *
 * 実装する順番
 *
 * 実装済み
 *
 * - getCurrentAdmin()による管理者検証
 * - DBのユーザー一覧・検索・権限別集計
 * - MEMBERとADMINの権限変更
 * - PENDING・ACTIVE・SUSPENDEDの利用状態変更
 * - 自分自身と最後の管理者を保護する処理
 * - 成功・失敗のtoast通知
 * - 権限変更APIのVitest
 *
 * 今後の手順
 *
 * 1. AdminAuditLogを定義し、「誰が・誰に・何をしたか」を保存する。
 * 2. 管理操作履歴を管理画面へ表示する。
 * 3. MFA解除などのCognito操作はAWS SDKをサーバー側だけで実行する。
 * 4. 監査ログ・Cognito操作をVitestでテストする。
 *
 * セキュリティ上の注意
 *
 * - UIを非表示にするだけでは認可にならない。APIごとにADMIN権限を検証する。
 * - AWS認証情報や管理用シークレットをブラウザへ渡さない。
 * - 最後の管理者を一般ユーザーへ変更できないようにする。
 * - 自分自身の停止や権限解除には、追加確認または禁止ルールを設ける。
 * - MFA解除、停止、権限変更には確認画面と操作理由を設ける。
 * - ユーザーの物理削除は避け、まずstatusによる利用停止を採用する。
 */

export {};
