// 偽物のHTTPリクエストを作る
//         ↓
// POST /api/auth/sessionを直接呼ぶ
//         ↓
// Cognito・Prisma・Sessionは偽物に差し替える
//         ↓
// 返ってきたStatusや、呼ばれた関数を確認する

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* 最初にmocksを定義しておくことで、vi.mockの中でのホイスティングによる変数errorをなくせる。 */
const mocks = vi.hoisted(() => ({
  verifyToken: vi.fn(),
  getCognitoUser: vi.fn(),
  upsertUser: vi.fn(),
  createSession: vi.fn(),
  deleteCookie: vi.fn(),
}));

vi.mock('@/lib/amplify/cognito-verify-access-token', () => ({
  verifyCognitoAccessToken: mocks.verifyToken,
}));

vi.mock('@/lib/amplify/get-cognito-user', () => ({
  getCognitoUser: mocks.getCognitoUser,
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      upsert: mocks.upsertUser,
    },
  },
}));

vi.mock('@/lib/session', () => ({
  createSession: mocks.createSession,
}));

vi.mock('@/lib/cookie', () => ({
  deleteCookie: mocks.deleteCookie,
}));

import { POST } from '@/app/api/auth/session/route';

describe('POST /api/auth/session', () => {
  beforeEach(() => {
    mocks.verifyToken.mockResolvedValue({
      sub: 'cognito-sub-123',
    });

    mocks.getCognitoUser.mockResolvedValue({
      sub: 'cognito-sub-123',
      email: 'test@example.com',
      name: 'テストユーザー',
      emailVerified: true,
    });

    mocks.upsertUser.mockResolvedValue({
      id: 'cognito-sub-123',
    });

    mocks.createSession.mockResolvedValue(undefined);
  });

  it('Authorization Headerがなければ401を返す', async () => {
    /* ここでclientのfetchをしているような感じ リクエスト */
    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
    });
    /* ここでapi/route.tsの動きをしている。POSTリクエストの関数を実行する感じ。 レスポンス */
    const response = await POST(request);

    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe('認証トークンがありませんでした。');
    expect(mocks.upsertUser).not.toHaveBeenCalled();
  });

  it('認証成功時にUserをupsertしてSessionを作る', async () => {
    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-access-token',
      },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('ログインしました。');

    expect(mocks.verifyToken).toHaveBeenCalledWith('test-access-token');
    expect(mocks.upsertUser).toHaveBeenCalledOnce();
    expect(mocks.createSession).toHaveBeenCalledWith('cognito-sub-123');
  });

  it('Cognitoのnameがなければ403を返す', async () => {
    mocks.getCognitoUser.mockResolvedValue({
      sub: 'cognito-sub-123',
      email: 'test@example.com',
      name: undefined,
      emailVerified: true,
    });

    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-access-token',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mocks.upsertUser).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});
