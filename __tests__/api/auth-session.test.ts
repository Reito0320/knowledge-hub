// 偽物のHTTPリクエストを作る
//         ↓
// POST /api/auth/sessionを直接呼ぶ
//         ↓
// Cognito・Prisma・Cookieは偽物に差し替える
//         ↓
// 返ってきたStatusや、呼ばれた関数を確認する

import { NextRequest } from 'next/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/* 最初にmocksを定義しておくことで、vi.mockの中でのホイスティングによる変数errorをなくせる。 */
const mocks = vi.hoisted(() => ({
  verifyActiveToken: vi.fn(),
  findUniqueUser: vi.fn(),
  setCookie: vi.fn(),
  deleteCookie: vi.fn(),
  getVerifiedCognitoSession: vi.fn(),
}));

vi.mock('@/lib/AWS/s3-presigned-url', () => ({
  createProfileImageViewUrl: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUniqueUser,
    },
  },
}));

vi.mock('@/lib/auth/cognito-session', () => ({
  COGNITO_ACCESS_TOKEN_COOKIE: 'cognito_access_token',
  getVerifiedCognitoSession: mocks.getVerifiedCognitoSession,
  verifyActiveCognitoAccessToken: mocks.verifyActiveToken,
}));

vi.mock('@/lib/cookie', () => ({
  deleteCookie: mocks.deleteCookie,
  setCookie: mocks.setCookie,
}));

import { POST } from '@/app/api/auth/session/route';

describe('POST /api/auth/session', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mocks.verifyActiveToken.mockResolvedValue({
      payload: {
        sub: 'cognito-sub-123',
        exp: Math.floor(Date.now() / 1000) + 3600,
      },
      cognitoUser: { sub: 'cognito-sub-123' },
      accessToken: 'test-access-token',
    });

    mocks.findUniqueUser.mockResolvedValue({
      id: 'cognito-sub-123',
      status: 'ACTIVE',
    });

    mocks.setCookie.mockResolvedValue(undefined);
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
    expect(mocks.findUniqueUser).not.toHaveBeenCalled();
  });

  it('認証成功時にCognito Access TokenをCookieへ保存する', async () => {
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

    expect(mocks.verifyActiveToken).toHaveBeenCalledWith('test-access-token');
    expect(mocks.findUniqueUser).toHaveBeenCalledWith({
      where: { id: 'cognito-sub-123' },
      select: { id: true, status: true },
    });
    expect(mocks.setCookie).toHaveBeenCalledWith(
      'cognito_access_token',
      'test-access-token',
      expect.any(Number),
    );
  });

  it('DBにUserが存在しなければ403を返す', async () => {
    mocks.findUniqueUser.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer test-access-token',
      },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mocks.findUniqueUser).toHaveBeenCalledOnce();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it('Cognitoで失効済みのTokenをCookieへ保存しない', async () => {
    mocks.verifyActiveToken.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      headers: { Authorization: 'Bearer revoked-token' },
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(mocks.findUniqueUser).not.toHaveBeenCalled();
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it('承認待ちユーザーにはSessionを作らない', async () => {
    mocks.findUniqueUser.mockResolvedValue({
      id: 'cognito-sub-123',
      status: 'PENDING',
    });

    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-access-token' },
    });

    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.message).toBe('管理者の承認待ちです。');
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });

  it('利用停止中のユーザーにはSessionを作らない', async () => {
    mocks.findUniqueUser.mockResolvedValue({
      id: 'cognito-sub-123',
      status: 'SUSPENDED',
    });

    const request = new NextRequest('http://localhost/api/auth/session', {
      method: 'POST',
      headers: { Authorization: 'Bearer test-access-token' },
    });

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(mocks.setCookie).not.toHaveBeenCalled();
  });
});
