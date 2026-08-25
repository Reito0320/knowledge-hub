/* テスト用のダミーの値 */
/*
ファイル変更を監視しながら実行
npm test
一度だけ全テストを実行
npm run test:run
*/
process.env.JWT_SECRET =
  'vitest-only-secret-key-that-is-longer-than-32-characters';

process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID = 'ap-northeast-1_testPool';

process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID = 'test-client-id';

process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/test_database';
