# ログインセッション

- CognitoのAccess Token / ID Tokenの有効期限は240分（従来60分 + 3時間）。2026-09-13に、このプロジェクトの環境設定が指すアプリクライアントへ反映済み。Refresh Tokenの期限とその他の設定は維持している。
- 有効期限はCognito側の設定。コードのpushだけでは別のアプリクライアントには反映されない。別環境を作る場合も240分に設定する。
- 変更前のTokenの期限は変わらず、再ログインまたは更新後のTokenから4時間になる。
- 「ログイン状態を保持」が有効ならAmplifyの認証情報をlocalStorageへ保存する。無効ならsessionStorageへ保存し、サーバーのCookieもブラウザーセッション限りにする。
- 永続Cookieの期限も検証済みJWTの期限を超えない。期限前にTokenを更新し、HttpOnly Cookieへ同期する。保持中もCognitoのRefresh Tokenが失効・取り消しされたら再ログインが必要。

参考: [Cognito UpdateUserPoolClient](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_UpdateUserPoolClient.html)、[Amplify session storage](https://docs.amplify.aws/gen1/react/build-a-backend/auth/manage-user-session/)
