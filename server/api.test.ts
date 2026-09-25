import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

const mocks = vi.hoisted(() => ({
  verify: vi.fn(), cognitoUser: vi.fn(),
  findFirstUser: vi.fn(), findUniqueUser: vi.fn(), findManyUsers: vi.fn(),
  findDepartments: vi.fn(), findDepartment: vi.fn(), createDepartment: vi.fn(),
  audit: vi.fn(), imageUrl: vi.fn(), findPost: vi.fn(), findPosts: vi.fn(),
}));
vi.mock('@/server/src/infrastructure/aws/get-cognito-user', () => ({ getCognitoUser: mocks.cognitoUser }));
vi.mock('@/server/src/infrastructure/aws/s3-presigned-url', () => ({
  createPostImageViewUrl: mocks.imageUrl,
  createProfileImageViewUrl: vi.fn(),
  createPostImageUploadUrl: vi.fn(),
  createProfileImageUploadUrl: vi.fn(),
  deleteProfileImageObject: vi.fn(),
  POST_IMAGE_UPLOAD_URL_EXPIRES_IN: 60,
  PROFILE_IMAGE_UPLOAD_URL_EXPIRES_IN: 60,
}));
vi.mock('@/server/src/infrastructure/prisma', () => ({
  prisma: {
    $disconnect: vi.fn(),
    user: { findFirst: mocks.findFirstUser, findUnique: mocks.findUniqueUser, findMany: mocks.findManyUsers },
    department: { findMany: mocks.findDepartments, findUnique: mocks.findDepartment, create: mocks.createDepartment },
    adminAuditLog: { create: mocks.audit },
    post: { findUnique: mocks.findPost, findMany: mocks.findPosts },
  }
}));

import { AuthService } from './src/auth/auth.service';
import { createApp } from './src/app';

let app: NestFastifyApplication;
const cookie = { cookie: 'cognito_access_token=valid-token' };

beforeAll(async () => {
  app = await createApp({ logger: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => { await app?.close(); });
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(AuthService.prototype, 'verifyAccessToken').mockImplementation(async (accessToken) => {
    const payload = await mocks.verify(accessToken);
    const cognitoUser = await mocks.cognitoUser(accessToken);
    return { accessToken, payload, cognitoUser };
  });
  mocks.verify.mockResolvedValue({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + 3600 });
  mocks.cognitoUser.mockResolvedValue({ sub: 'user-1', name: 'Test', email: 'test@example.com' });
  mocks.findFirstUser.mockImplementation(async ({ where }) => where.role ? null : { id: where.id, role: 'MEMBER' });
  mocks.findUniqueUser.mockResolvedValue({ id: 'user-1', status: 'ACTIVE', name: 'Test', photoObjectKey: null });
  mocks.findDepartments.mockResolvedValue([{ id: 'dept-1', name: '開発部' }]);
  mocks.findManyUsers.mockResolvedValue([]);
});

describe('NestJS HTTP API', () => {
  // An explicit inventory catches omitted routes and incorrect method decorators.
  it.each([
    ['GET', '/auth/session', 401], ['POST', '/auth/session', 401],
    ['GET', '/post', 401], ['POST', '/post', 401],
    ['GET', '/post/post-1', 401], ['PATCH', '/post/post-1', 401], ['DELETE', '/post/post-1', 401],
    ['POST', '/post/post-1/like', 401], ['POST', '/post/post-1/bookmark', 401],
    ['POST', '/post/post-1/comments', 401], ['POST', '/post/images', 401],
    ['GET', '/post/images/user-1/image.png', 401],
    ['GET', '/posts/suggestions', 401], ['GET', '/tags/suggestions', 401],
    ['GET', '/users/suggestions', 401], ['POST', '/users/provision', 401],
    ['PATCH', '/users/profile', 401], ['POST', '/users/user-2/favorite', 401],
    ['GET', '/users/profile/image-upload', 401], ['POST', '/users/profile/image-upload', 401],
    ['PATCH', '/users/profile/image-upload', 401],
    ['GET', '/notifications', 401], ['PATCH', '/notifications', 401],
    ['POST', '/admin/departments', 403], ['PATCH', '/admin/departments/dept-1', 403],
    ['DELETE', '/admin/departments/dept-1', 403],
    ['PATCH', '/admin/users/user-2/role', 403], ['PATCH', '/admin/users/user-2/status', 403],
    ['POST', '/admin/users/user-2/session', 403], ['POST', '/admin/users/user-2/mfa-recovery', 403],
  ] as const)('%s %s enforces authorization (%i)', async (method, path, status) => {
    const response = await app.inject({ method, url: `/api${path}` });
    expect(response.statusCode).toBe(status);
    expect(response.json().message).toEqual(expect.any(String));
    expect(mocks.findFirstUser).not.toHaveBeenCalled();
  });

  it('returns public departments as JSON', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/departments' });
    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/json');
    expect(response.json()).toEqual({ departments: [{ id: 'dept-1', name: '開発部' }] });
  });

  it.each([false, true])('creates a secure session with remember-me=%s', async (remember) => {
    const response = await app.inject({
      method: 'POST', url: '/api/auth/session', headers: {
        authorization: 'Bearer valid-token', 'x-remember-me': String(remember),
      }
    });
    expect(response.statusCode).toBe(200);
    const header = String(response.headers['set-cookie']);
    expect(header).toContain('cognito_access_token=valid-token');
    for (const attribute of ['HttpOnly', 'Secure', 'SameSite=Lax', 'Path=/']) expect(header).toContain(attribute);
    expect(header.includes('Max-Age=')).toBe(remember);
    if (remember) expect(Number(header.match(/Max-Age=(\d+)/)?.[1])).toBeLessThanOrEqual(3600);
    expect(mocks.verify).toHaveBeenCalledWith('valid-token');
  });

  it('verifies the incoming cookie and returns the session', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/auth/session', headers: cookie });
    expect(response.statusCode).toBe(200);
    expect(response.json().user.id).toBe('user-1');
    expect(mocks.verify).toHaveBeenCalledWith('valid-token');
  });

  it('clears expired or revoked sessions', async () => {
    mocks.cognitoUser.mockRejectedValue(new Error('revoked'));
    const response = await app.inject({ method: 'GET', url: '/api/auth/session', headers: cookie });
    expect(response.statusCode).toBe(401);
    expect(String(response.headers['set-cookie'])).toContain('Max-Age=0');
    expect(mocks.findUniqueUser).not.toHaveBeenCalled();
  });

  it('sends both deletion cookies on logout', async () => {
    const response = await app.inject({ method: 'DELETE', url: '/api/auth/session', headers: cookie });
    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toEqual([
      expect.stringMatching(/^cognito_access_token=.*Max-Age=0$/),
      expect.stringMatching(/^session=.*Max-Age=0$/),
    ]);
  });

  it('keeps cookies isolated between concurrent requests', async () => {
    const [loggedIn, anonymous] = await Promise.all([
      app.inject({ method: 'GET', url: '/api/auth/session', headers: cookie }),
      app.inject({ method: 'GET', url: '/api/auth/session' }),
    ]);
    expect(loggedIn.statusCode).toBe(200);
    expect(loggedIn.headers['set-cookie']).toBeUndefined();
    expect(anonymous.statusCode).toBe(401);
    expect(String(anonymous.headers['set-cookie'])).toContain('Max-Age=0');
  });

  it('forwards URL query parameters to member search', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/users/suggestions?q=%20Alice%20', headers: cookie });
    expect(response.statusCode).toBe(200);
    expect(mocks.findManyUsers).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: { not: 'user-1' }, name: { contains: 'Alice', mode: 'insensitive' },
      }
    }));
  });

  it('rejects a non-admin even with a valid session', async () => {
    const response = await app.inject({ method: 'PATCH', url: '/api/admin/users/user-2/role', headers: cookie, payload: { role: 'ADMIN' } });
    expect(response.statusCode).toBe(403);
    expect(mocks.findFirstUser).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'user-1', role: 'ADMIN', status: 'ACTIVE' } }));
  });

  it('parses JSON and preserves the department creation status', async () => {
    mocks.findFirstUser.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    mocks.findDepartment.mockResolvedValue(null);
    mocks.createDepartment.mockResolvedValue({ id: 'dept-2', name: '営業部' });
    const response = await app.inject({ method: 'POST', url: '/api/admin/departments', headers: cookie, payload: { name: ' 営業部 ' } });
    expect(response.statusCode).toBe(201);
    expect(response.json().department).toEqual({ id: 'dept-2', name: '営業部' });
    expect(mocks.audit).toHaveBeenCalledOnce();
  });

  it('rejects malformed JSON at the HTTP boundary', async () => {
    const response = await app.inject({ method: 'PATCH', url: '/api/users/profile', headers: { ...cookie, 'content-type': 'application/json' }, payload: '{' });
    expect(response.statusCode).toBe(400);
    expect(mocks.findFirstUser).not.toHaveBeenCalled();
  });

  it('rejects invalid image metadata after authentication', async () => {
    const response = await app.inject({ method: 'POST', url: '/api/post/images', headers: cookie, payload: { contentType: 'text/html', fileSize: 10 } });
    expect(response.statusCode).toBe(400);
  });

  it('preserves image redirects and private cache headers', async () => {
    const file = '12345678-1234-1234-1234-123456789abc.png';
    mocks.imageUrl.mockResolvedValue('https://images.example.com/signed');
    const response = await app.inject({ method: 'GET', url: `/api/post/images/user-1/${file}`, headers: cookie });
    expect(response.statusCode).toBe(307);
    expect(response.headers.location).toBe('https://images.example.com/signed');
    expect(response.headers['cache-control']).toBe('private, no-store');
    expect(mocks.imageUrl).toHaveBeenCalledWith(`post-images/user-1/${file}`);
  });

  it('uses the dynamic post ID and hides nonexistent posts', async () => {
    mocks.findPost.mockResolvedValue(null);
    const response = await app.inject({ method: 'GET', url: '/api/post/missing-post', headers: cookie });
    expect(response.statusCode).toBe(404);
    expect(mocks.findPost).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'missing-post' } }));
  });

  it('returns 500 without leaking unhandled database errors', async () => {
    mocks.findDepartments.mockRejectedValue(new Error('private database detail'));
    const response = await app.inject({ method: 'GET', url: '/api/departments' });
    expect(response.statusCode).toBe(500);
    expect(response.body).not.toContain('private database detail');
  });

  it('returns 404 for unregistered API routes', async () => {
    expect((await app.inject({ method: 'GET', url: '/api/does-not-exist' })).statusCode).toBe(404);
  });
});
