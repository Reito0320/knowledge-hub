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
| スタイリング | Tailwind CSS 4、Motion |
| データベース | PostgreSQL、Prisma ORM 7、`@prisma/adapter-pg` |
| 認証 | Amazon Cognito、AWS Amplify、`aws-jwt-verify` |
| 画像保存 | Amazon S3（署名付きURLでアップロード・表示） |
| Markdown表示 | react-markdown、remark-gfm、rehype-sanitize |
| テスト・静的解析 | Vitest、Testing Library、ESLint |

Cognitoが本人確認を担当し、PostgreSQLがアプリ内の権限・利用状態・プロフィール・記事などを管理します。ユーザーIDにはCognitoの`sub`を使用します。

## ローカル開発

### 前提条件

- Node.js：Prismaの要件を満たすバージョン（`^20.19`、`^22.12`、または`>=24.0`）
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
| `DATABASE_URL` | アプリが使用するPostgreSQL接続URL |
| `DIRECT_URL` | 任意。マイグレーション・シード用接続URL。未設定時は`DATABASE_URL`を使用 |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | CognitoユーザープールID |
| `NEXT_PUBLIC_COGNITO_CLIENT_ID` | CognitoアプリクライアントID |
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
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | Prisma Client生成後に本番ビルド |
| `npm start` | ビルド済みアプリの起動 |
| `npm run lint` | ESLintの実行 |
| `npm test` | Vitestをウォッチモードで実行 |
| `npm run test:run` | テストを1回実行 |
| `npm run db:seed` | 開発用サンプルデータの投入 |
| `npm run db:rollback` | シード用ユーザーと関連データ、未使用のシード用タグ・部署を削除 |

`db:rollback`はスキーマのマイグレーションを取り消すコマンドではありません。シード用ユーザーに紐づくデータも削除されるため、開発用DBで使用してください。

## ディレクトリ構成

```text
app/                 画面、Route Handlers（app/api）、Server Actions
comp/                ヘッダー、Markdown表示などの共通コンポーネント
lib/                 認証、AWS連携、記事の閲覧権限などの共通処理
prisma/              DBスキーマ、マイグレーション、シード
__tests__/           API・共通処理のテスト
docs/                開発資料
proxy.ts             保護対象ページへのアクセス時のトークン検証
prisma.config.ts     Prisma CLIの接続先・シード設定
```

Next.jsの実装を変更する際は、[AGENTS.md](AGENTS.md)に従い、インストール済みバージョンの`node_modules/next/dist/docs/`を確認してください。
