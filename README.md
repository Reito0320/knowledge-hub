# Knowledge Hub

社内の技術知識や業務ノウハウを蓄積・共有するナレッジ共有アプリです。ZennやQiitaのように記事を投稿し、部署やメンバーを通じて必要な知識を見つけられる、社内向けの情報共有の場を目指しています。

## 主な機能

- **記事の作成・管理**：Markdown編集とプレビュー、画像アップロード、技術／業務カテゴリ、タグ、下書き・公開・アーカイブの管理。
- **公開範囲の設定**：社内全体、リンク限定、部署限定、自分のみの4種類。リンク限定もログインしたメンバー向けで、下書き・アーカイブは投稿者本人のみ閲覧できます。
- **ナレッジの閲覧**：ホームに人気記事、新着記事、注目タグ、メンバーを表示。
- **記事へのリアクション**：いいね、コメント、ブックマーク、コメント・いいねした記事の履歴表示。
- **メンバーとのつながり**：メンバー検索、お気に入り登録、お気に入りメンバーの新着記事通知、通知の既読管理。
- **プロフィール編集**：表示名、部署、役職、自己紹介、プロフィール画像の設定。
- **認証**：Amazon Cognitoによる新規登録・確認コード認証・ログイン、TOTP方式のMFA設定とコード入力。
- **管理者機能**：ユーザーの権限・利用状態の変更、セッション失効、MFAリセット、部署マスタ管理、利用状況の集計、監査ログの閲覧。

記事・カテゴリ・タグの検索結果画面は現在準備中です。メンバー検索は実装されています。

## 技術構成

| 用途 | 技術 |
| --- | --- |
| アプリケーション | Next.js 16.2.12（App Router）、React 19、TypeScript |
| HTTP API | NestJS 12、Fastify 5 |
| スタイリング | Tailwind CSS 4、Motion |
| データベース | PostgreSQL、Prisma ORM 7、`@prisma/adapter-pg` |
| 認証 | Amazon Cognito、AWS Amplify、NestJS JwtModule / JwtService・共通 Guard |
| 画像保存 | Amazon S3（署名付きURLでアップロード・表示） |
| Markdown表示 | react-markdown、remark-gfm、rehype-sanitize |
| テスト・静的解析 | Vitest、Testing Library、ESLint |

Cognitoが本人確認を担当し、PostgreSQLがアプリ内の権限・利用状態・プロフィール・記事などを管理します。ユーザーIDにはCognitoの`sub`を使用します。

## ローカル開発

### 前提条件

- Node.js：22.12 以上（22 LTS / 24 LTS 推奨）
- npm
- PostgreSQLの接続先
- Amazon Cognitoのユーザープールとブラウザ向けアプリクライアント
- 画像機能を利用する場合はAmazon S3バケット

Cognitoではメールアドレス・名前を使った登録と確認コード認証を設定してください。TOTP MFAを利用する場合はユーザープール側でも有効にします。

S3はブラウザから署名付きURLへアップロードするため、開発元のオリジン（例：`http://localhost:3000`）からのPUTと必要なヘッダーを許可するCORS設定が必要です。サーバー側には、画像の取得・保存・削除やCognitoの管理操作に必要なAWS認証情報・IAM権限を設定してください。AWS SDKの認証情報プロバイダーチェーンを使用します。

### 1. 依存関係のインストール

```bash
npm ci
```

### 2. 環境変数の設定

`.env.example`をコピーして、プロジェクト直下に`.env`を作成します。

```bash
cp .env.example .env
```

以下のダミー値を自分の環境の値に置き換えてください。

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/knowledge_hub"
NEXT_PUBLIC_COGNITO_USER_POOL_ID="ap-northeast-1_EXAMPLE"
NEXT_PUBLIC_COGNITO_CLIENT_ID="your-app-client-id"
S3_BUCKET_NAME="your-bucket-name"
S3_REGION="ap-northeast-1"
ADMIN_ACCOUNT_EMAIL="admin@example.com"
```

| 変数 | 用途 |
| --- | --- |
| `API_ORIGIN` | Next.js の API 転送先。既定値 `http://127.0.0.1:3001`。ビルド時に設定 |
| `API_HOST` / `API_PORT` | NestJS の待ち受け先。既定値 `127.0.0.1` / `3001` |
| `DATABASE_URL` | アプリが使用するPostgreSQL接続URL |
| `DIRECT_URL` | 任意。マイグレーション・シード用接続URL。未設定時は`DATABASE_URL`を使用 |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | CognitoユーザープールID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | ブラウザの Cognito アプリクライアント ID |
| `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` | API ホストの Cognito 設定。未設定時は対応する `NEXT_PUBLIC_` 値を使用 |
| `S3_BUCKET_NAME` | 画像保存先のS3バケット名 |
| `S3_REGION` | S3バケットのリージョン |
| `ADMIN_ACCOUNT_EMAIL` | アプリのDBへ初回登録する際に管理者権限を付与するメールアドレス |

`ADMIN_ACCOUNT_EMAIL`は対象ユーザーの初回登録前に設定します。既存ユーザーの権限は、この値を変更しても自動では更新されません。通常ユーザーは`MEMBER`・`ACTIVE`で作成され、現在は初回利用時の管理者承認を必須にしていません。

`.env`と`.env.*`はGit管理対象外です（ダミー値だけを含む`.env.example`・`.env.sample`を除く）。`NEXT_PUBLIC_`付きの値はブラウザに公開されるため、AWSの秘密鍵などは設定しないでください。

プロフィール画像の許可ホストは`S3_BUCKET_NAME`と`S3_REGION`から生成します。画像機能を使う場合はビルド時にも両方を設定し、変更後は開発サーバーの再起動、または本番の再ビルド・再デプロイを行ってください。未設定の場合、S3の画像ホストは許可されません。

### 3. データベースの準備

接続先のデータベースを用意したうえで、既存のマイグレーションを適用し、Prisma Clientを生成します。

```bash
npx prisma migrate deploy
npx prisma generate --generator client
```

開発用サンプルデータが必要な場合は、次を実行します。

```bash
npm run db:seed
```

シードは部署・ユーザー・記事・タグ・コメント・いいねをDBに登録します。Cognitoアカウントは作成しないため、ログイン用ユーザーはアプリから別途登録してください。

### 4. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)にアクセスします。未ログインの場合はログイン画面へ移動します。

`npm run dev` は Next.js（3000）と NestJS（3001）を同時起動します。ブラウザは従来どおり `/api/...` を呼び、Next.js の rewrite が NestJS へ転送します。同一オリジンの Cookie 認証を維持するため、ブラウザから 3001 を直接呼ぶ必要はありません。

## 主な画面

| パス | 内容 |
| --- | --- |
| `/` | ホーム（人気記事・新着記事など） |
| `/signup`、`/confirm`、`/login` | 新規登録・確認コード認証・ログイン |
| `/post` | 自分の記事の管理 |
| `/post/new` | 記事作成 |
| `/post/[postId]` | 記事詳細 |
| `/post/[postId]/edit` | 記事編集 |
| `/search` | メンバー検索（記事・カテゴリ・タグ検索は準備中） |
| `/bookmarks` | ブックマークした記事・お気に入りメンバー |
| `/activity` | コメント・いいねの履歴 |
| `/admin` | ユーザー管理・利用状況の集計 |
| `/admin/settings` | 部署マスタ管理 |
| `/admin/audit-logs` | 管理操作の監査ログ |

プロフィール編集と新着通知の確認はヘッダーから行います。管理画面は`ADMIN`権限を持つユーザー向けです。

## 開発コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | Next.js と NestJS の開発サーバーを同時起動 |
| `npm run dev:web` / `npm run dev:api` | 各サーバーだけを開発起動（初回は `npm run build:api`） |
| `npm run build` | NestJS と Next.js を本番ビルド |
| `npm run build:web` | Next.js のみビルド（DB・Prisma の実行なし） |
| `npm run build:api` / `npm run typecheck:api` | NestJS のビルド / API と API テストの型検査 |
| `npm start` | ビルド済み Next.js と NestJS を同時起動 |
| `npm run start:web` / `npm run start:api` | 本番サーバーを個別起動 |
| `npm run lint` | ESLintの実行 |
| `npm test` | Vitestをウォッチモードで実行 |
| `npm run test:run` | API・共通処理・UI の全テストを1回実行 |
| `npm run test:api` | NestJS API の Vitest テストのみ実行 |
| `npm run db:seed` | 開発用サンプルデータの投入 |
| `npm run db:rollback` | シード用ユーザーと関連データ、未使用のシード用タグ・部署を削除 |

`db:rollback`はスキーマのマイグレーションを取り消すコマンドではありません。シード用ユーザーに紐づくデータも削除されるため、開発用DBで使用してください。

## ディレクトリ構成

```text
app/                 画面と Server Component からの API 呼び出し
lib/api/             NestJS API 呼び出し用 fetch 関数
lib/auth/session-context.tsx  セッション共有と更新処理
lib/post/editor/     記事の Reducer・Context・自動保存 Hook
lib/header/          通知・プロフィール編集のカスタム Hook
server/src/          NestJS Controller、認証 Guard、JWT 検証、DB・AWS 処理
server/api.test.ts   NestJS を起動し Fastify inject で HTTP 境界を検証
scripts/build-api.mjs  NestJS の独立した Node.js バンドルを生成
comp/                ヘッダー、Markdown表示などの共通コンポーネント
lib/                 フロントエンドの状態管理、API 呼び出し、共通ドメイン処理
lib/contracts/       Prisma に依存しない JSON API の共有型
prisma/              DBスキーマ、マイグレーション、シード
__tests__/           API・共通処理のテスト
docs/                開発資料
proxy.ts             保護対象ページへのアクセス時に NestJS へ認証を問い合わせる
prisma.config.ts     Prisma CLIの接続先・シード設定
```

Next.jsの実装を変更する際は、[AGENTS.md](AGENTS.md)に従い、インストール済みバージョンの`node_modules/next/dist/docs/`を確認してください。

## API の構成とテスト

既存の 23 Route Handler ファイル（32 メソッド）は `server/src/controllers/` の NestJS Controller へ移しました。URL・JSON・ステータス・画像リダイレクトは維持しています。Controller は標準の Web Request / Response を使い、NestJS のカスタム引数デコレーターと Interceptor が Fastify の HTTP に変換します。API は `next/server` に依存しません。

JWT 検証は NestJS の `JwtModule` / `JwtService`、認証・管理者権限の検証は共通 `AuthGuard` に集約しています。JWT 発行元は Cognito を維持し、公開鍵・RS256・issuer・期限・client_id・token_use を確認したうえで Cognito の失効状態と DB の最新状態・権限を確認します。Next.js は JWT を直接検証しません。

`"use server"` の Server Action はなく、従来 Server Component が直接実行していたホーム・検索・お気に入り・履歴・管理画面の DB / S3 処理を NestJS の画面用 API へ移しています。Next.js の Server Component はセッション Cookie を転送して API を取得し、画面を描画します。Next.js 側には DB 接続先・サーバー用 AWS 認証情報は不要です。

API の個別ビルド・環境変数・EC2 向け systemd 設定例は [server/README.md](server/README.md) を参照してください。クラウドへの実際のデプロイは行っていません。

API テストは既存の Controller 単体テストと HTTP 統合テストで構成しています。HTTP 統合テストは全ルートの認可、セッション Cookie の発行・削除・並行リクエスト間の分離、JSON・クエリ・パス変数、画像リダイレクト、エラー応答を検証します。Prisma と AWS の外部境界はモックしているため、実 DB / Cognito / S3 は不要です。実サービスへの接続を検証する E2E テストではありません。

本番は Next.js と NestJS の両プロセスが必要です。別ホストへ配置する場合は Next.js のビルド時に `API_ORIGIN` を設定し、NestJS の `API_HOST` とネットワークの接続先を合わせてください。API は `.env`（存在する場合）とプロセスの環境変数を読み込みます。認証 Cookie は従来どおり `Secure`・`HttpOnly`・`SameSite=Lax` です。

## クライアントの状態管理

セッションは `SessionProvider` と `useSession()` で共有します。ログイン、Token 復元、プロフィール保存、サインアウトが同じ状態を更新し、古い取得結果が新しいプロフィールやログアウト結果を上書きしないようにしています。認可は引き続きサーバー側で行います。

記事の入力値と保存状態は、記事ごとの `PostEditorProvider` 内の `useReducer` に集約しています。入力欄と保存ボタンは `usePostEditor()` で同じデータを読み、自動保存のタイマーと API 呼び出しは `useEditorController` が管理します。コンポーネント間の同期に CustomEvent や localStorage は使用しません。保存中の追加入力は変更として保持し、次の保存へ回します。

通知一覧と未読件数は `useNotifications`、プロフィールの入力・画像プレビュー・保存状態は `useProfileEditor` でまとめて更新します。単独コンポーネントだけで使う表示切り替えなどはローカルな状態として保持しています。Vitest では、状態共有、自動保存の重複防止と追加入力、ログアウト中の遅延応答、通知更新失敗、画像プレビューの解放、コピー成功・失敗の Toast 表示を検証します。
