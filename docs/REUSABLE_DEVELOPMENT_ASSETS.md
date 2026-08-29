# 他プロジェクトへ再利用できる開発資産

## そのまま再利用しやすいもの

| 分類 | 現在のファイル | 用途 |
| --- | --- | --- |
| JWT | `lib/jwt.ts` | HS256によるSession JWTの発行・検証 |
| Cookie | `lib/cookie.ts` | HttpOnly Cookieの取得・保存・削除 |
| Session | `lib/session.ts` | userIdを持つSessionの作成 |
| Cognito | `lib/amplify/cognito.ts` | Amplify AuthのUser Pool設定 |
| Cognito検証 | `lib/amplify/cognito-verify-access-token.ts` | Access Tokenの署名・発行元・用途・期限の検証 |
| Cognito User | `lib/amplify/get-cognito-user.ts` | Access TokenからCognito属性を取得 |
| Prisma設定 | `prisma.config.ts` | schema、migration、seed、DIRECT_URLの設定 |
| Prisma Client | `lib/prisma.ts` | 開発中のClient多重生成を防ぐSingleton |
| テスト | `vitest.config.mts`、`vitest.setup.ts` | alias・React・テスト環境変数の設定 |
| タグ色 | `lib/tag/get-tag-color-class.ts` | 名前から安定した表示色を算出 |
| Loading UI | `app/loading.tsx` | App Routerのストリーミング用Skeleton |

## 設計だけ再利用し、モデルに合わせて変更するもの

- `lib/auth/get-current-user.ts`
  - Session検証までは共通化できる。
  - Prismaの`User`モデルと主キーはプロジェクトごとに変更する。
- `lib/post/create-post-tag-data.ts`
  - `connectOrCreate`の考え方は再利用できる。
  - Tag/PostTagの名前とslugルールは変更が必要。
- `app/api/auth/session/route.ts`
  - Cognito Tokenから自前Sessionへ交換する構成は再利用できる。
  - DB User作成とはAPIを分離する。
- いいね・お気に入り
  - `(userId, postId)`の複合主キーとトグル処理は再利用できる。
  - 対象モデル名と公開条件は変更する。

## 自動生成スクリプト

プロジェクト直下へ生成する場合：

```bash
bash scripts/create-next-foundation.sh .
```

別プロジェクトへ生成する場合：

```bash
bash scripts/create-next-foundation.sh ../another-project
```

既存ファイルは上書きせず`skip`として残す。生成物には秘密情報を含めず、実値は各環境の環境変数へ設定する。

## スクリプトが生成するもの

- `.env.example`
- JWT・Cookie・Session共通処理
- Amplify/Cognito設定とToken検証
- タグ色ユーティリティ
- JSON API共通クライアント
- Vitest設定
- Prisma CLI設定
- App Router用`loading.tsx`
- 導入手順`REUSABLE_FOUNDATION.md`

## 自動生成に含めないもの

- 実際の秘密鍵、DB URL、AWS認証情報
- Prisma schema本体
- Cognito User Pool/App Clientの作成
- 業務固有のUser/Post/Department API
- S3 Bucketや署名付きURL API

これらは環境・権限・データモデルによって安全な設定が変わるため、自動生成後に個別実装する。
