# NestJS API

Next.js から独立した Node.js サーバーです。HTTP API、Cognito JWT 認証、権限判定、Prisma、S3・Cognito の管理操作を担当します。Next.js には DB 接続先や AWS サーバー用認証情報を渡す必要はありません。

## 認証

JWT の発行元は既存の Cognito のままです。NestJS `JwtModule` / `JwtService` が署名・期限・issuer を検証し、共通 `AuthGuard` がすべての API を既定で保護します。ブラウザは HttpOnly Cookie、API クライアントは `Authorization: Bearer ...` を使用できます。

- Cognito の固定 JWKS URL から `kid` に対応する鍵を取得。キャッシュと取得回数制限を使用。
- `RS256`、正しい User Pool の issuer、`token_use=access`、アプリの `client_id`、`sub`、`exp` を必須とする。
- `GetUser` で失効・無効化された Cognito セッションを拒否する。
- 通常 API は DB の最新 `ACTIVE` 状態、`@AdminOnly()` は最新 `ADMIN` 権限も確認する。
- `@CognitoOnly()` はログイン済みだが DB 登録前の provisioning とセッション確認に限る。
- `@Public()` はログイン用セッション作成、ログアウト、登録画面の部署一覧、ヘルスチェックに限る。セッション作成は Controller から同じ AuthService で Bearer Token を検証する。

アプリ独自の JWT 発行や JWT Secret はありません。既存の Cognito アカウント・MFA・ログインを維持します。

## 画面用 API

| API | 用途 | 権限 |
| --- | --- | --- |
| `GET /api/home` | ホームの集計・記事・メンバー | ACTIVE |
| `GET /api/search` | 記事・タグ・メンバー検索とページング | ACTIVE |
| `GET /api/bookmarks` | ブックマーク・お気に入りメンバー | ACTIVE |
| `GET /api/activity` | コメント・いいね履歴 | ACTIVE |
| `GET /api/admin/dashboard` | ユーザー管理・集計 | ADMIN |
| `GET /api/admin/settings` | 部署と所属人数 | ADMIN |
| `GET /api/admin/audit-logs` | 操作履歴と絞り込み | ADMIN |
| `GET /api/auth/check` | Next.js Proxy の認証確認 | ACTIVE |
| `GET /api/health` | プロセスの liveness | 公開 |

既存の投稿・プロフィール・管理操作 API も同じ Guard を通ります。日付は ISO 8601 の JSON 文字列です。画面との共有型は `lib/contracts/` に置き、Prisma の型やサーバー実装を Next.js から import しません。Server Component は `lib/api/server.ts` 経由でセッション Cookie だけを転送します。API を直接呼ばれても認証は迂回できません。

## 個別ビルドと起動

リポジトリルートで実行します。Node.js 22.12 以上が必要です。

```sh
npm ci
npm run build:api
npm run typecheck:api
npm run test:api
npm run start:api
```

`build:api` は Prisma Client を生成してから `server/dist/main.mjs` を出力します。Next.js のビルドは不要です。`start:api` はプロジェクトルートの `.env`（存在する場合）とプロセスの環境変数を読み込みます。環境変数だけで起動する場合は `node server/dist/main.mjs` でも動きます。

環境変数のひな形は [server/.env.example](.env.example) です。ローカル移行の互換性のため `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` 未設定時は対応する `NEXT_PUBLIC_` 値を参照します。フロントエンドと API に同じ User Pool とアプリクライアントを指定してください。

## EC2 へ配置する場合

クラウドへの配置自体は行っていません。以下はホスト設定に合わせて使用する起動例です。

1. CI またはビルド環境で `npm ci && npm run build:api` を実行。
2. `server/dist/`、`package.json`、`package-lock.json` を EC2 の `/opt/knowledge-hub` に配置し、そこで `npm ci --omit=dev` を実行。Next.js の成果物やソースファイルは API の起動に不要。
3. API 用環境変数を `/etc/knowledge-hub/api.env` に設定。AWS SDK は標準の認証情報チェーンを使うため、EC2 の IAM ロールを利用できます。
4. [systemd 設定例](deploy/knowledge-hub-api.service) のユーザー、ディレクトリ、Node.js の絶対パスを実環境に合わせて設定。終了時は NestJS の shutdown hook が Prisma 接続を閉じます。
5. `GET /api/health` が `200 {"status":"ok"}` を返すことを確認。この API は DB や Cognito の疎通確認は行いません。
6. Next.js の `API_ORIGIN` を API ホストの到達可能な URL に変更し、Next.js を再ビルド・再起動。ブラウザからは引き続き Next.js と同一オリジンの `/api/...` を呼びます。

同一ホストのリバースプロキシ経由では既定の `API_HOST=127.0.0.1` を使用できます。別ホストから接続する場合は待ち受けアドレスとネットワーク設定を合わせてください。認証 Cookie の `Secure` 属性を維持するため、公開側は HTTPS を使用します。CORS を開放してブラウザから API ホストへ直接接続する構成にはしていません。

## テスト

Vitest で HTTP ルーティング、画面用 API、認可、実際の RSA 鍵で署名した JWT、期限切れ・署名不正・issuer / client_id / token_use 不一致・失効確認を検証します。Prisma、Cognito、JWKS の外部通信はモックであり、本番 DB・AWS への疎通試験ではありません。
