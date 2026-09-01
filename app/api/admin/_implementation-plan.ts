/*
 * 管理画面APIの実装メモ
 *
 * このファイルにはAPI処理を実装していません。
 * route.tsではないため、この設計メモ自体が公開APIになることはありません。
 * 実装を始める際は、機能単位で次のようにroute.tsを作成します。
 *
 * app/api/admin/users/route.ts                 ユーザー一覧・検索
 * app/api/admin/users/[userId]/role/route.ts   管理者権限の付与・解除
 * app/api/admin/users/[userId]/status/route.ts 利用停止・再開
 * app/api/admin/users/[userId]/mfa/route.ts    CognitoのTOTP登録解除
 * app/api/admin/users/[userId]/session/route.ts 全端末のセッション失効
 * app/api/admin/audit-logs/route.ts            管理操作履歴の取得
 *
 * 実装する順番
 *
 * 1. Userへrole・statusを追加し、AdminAuditLogを定義する。
 * 2. getCurrentUser()で操作中のユーザーIDを取得する。
 * 3. DBのroleがADMINか検証する共通関数を作る。
 * 4. 各Route Handlerの最初で必ず管理者検証を実行する。
 * 5. リクエスト内容を検証してから、対象ユーザーを更新する。
 * 6. 「誰が・誰に・何をしたか」をAdminAuditLogへ保存する。
 * 7. MFA解除などのCognito操作はAWS SDKをサーバー側だけで実行する。
 * 8. UIを実データへ接続し、成功・失敗をtoastで通知する。
 * 9. 管理者APIの認可・入力値・監査ログをVitestでテストする。
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
