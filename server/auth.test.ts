import { generateKeyPairSync } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { JwtService } from '@nestjs/jwt';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';

const mocks = vi.hoisted(() => ({ key: vi.fn(), cognito: vi.fn(), user: vi.fn(), posts: vi.fn(), department: vi.fn() }));
vi.mock('jwks-rsa', () => ({ default: () => ({ getSigningKey: mocks.key }) }));
vi.mock('@/server/src/infrastructure/aws/get-cognito-user', () => ({ getCognitoUser: mocks.cognito }));
vi.mock('@/server/src/infrastructure/prisma', () => ({ prisma: {
    $disconnect: vi.fn(),
  user: { findFirst: mocks.user },
  post: { findMany: mocks.posts },
  department: { findMany: mocks.department },
} }));
import { createApp } from './src/app';

const keys = generateKeyPairSync('rsa', { modulusLength: 2048 });
const privateKey = keys.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
const publicKey = keys.publicKey.export({ type: 'spki', format: 'pem' }).toString();
const jwt = new JwtService();
const issuer = 'https://cognito-idp.ap-northeast-1.amazonaws.com/ap-northeast-1_testPool';
const mint = (claims: Record<string, unknown> = {}, signingKey = privateKey) => jwt.sign(Object.fromEntries(Object.entries({
  sub: 'u1', iss: issuer, token_use: 'access', client_id: 'test-client-id',
  exp: Math.floor(Date.now() / 1000) + 300, ...claims,
}).filter(([, value]) => value !== undefined)), { privateKey: signingKey, algorithm: 'RS256', keyid: 'current-key' });
let app: NestFastifyApplication;
beforeAll(async () => {
  app = await createApp({ logger: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => { await app.close(); });
beforeEach(() => {
  vi.resetAllMocks();
  mocks.key.mockResolvedValue({ getPublicKey: () => publicKey });
  mocks.cognito.mockResolvedValue({ sub: 'u1', name: 'Alice', email: 'a@example.com' });
  mocks.user.mockResolvedValue({ id: 'u1', role: 'MEMBER' });
  mocks.department.mockResolvedValue([]);
});

it('accepts a genuinely signed Cognito access JWT from a cookie', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/auth/check', headers: { cookie: `cognito_access_token=${mint()}` } });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ authenticated: true });
  expect(mocks.key).toHaveBeenCalledWith('current-key');
  expect(mocks.cognito).toHaveBeenCalledOnce();
  expect(mocks.user).toHaveBeenCalledWith({ where: { id: 'u1', status: 'ACTIVE' }, select: { id: true, role: true } });
});
it('accepts the same token via Bearer authentication', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${mint()}` } });
  expect(response.statusCode).toBe(200);
});
it.each([
  ['expired', { exp: Math.floor(Date.now() / 1000) - 5 }],
  ['future nbf', { nbf: Math.floor(Date.now() / 1000) + 600 }],
  ['wrong issuer', { iss: 'https://other.example.com' }],
  ['wrong app client', { client_id: 'another-client' }],
  ['ID token', { token_use: 'id' }],
  ['missing subject', { sub: '' }],
  ['missing expiration', { exp: undefined }],
] as const)('rejects %s without querying the application database', async (_name, claims) => {
  const response = await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${mint(claims)}` } });
  expect(response.statusCode).toBe(401);
  expect(mocks.user).not.toHaveBeenCalled();
});
it('rejects tokens signed by an unrelated key', async () => {
  const wrongKey = generateKeyPairSync('rsa', { modulusLength: 2048 }).privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  expect((await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${mint({}, wrongKey)}` } })).statusCode).toBe(401);
  expect(mocks.cognito).not.toHaveBeenCalled();
});
it('rejects HS256 tokens even if a public key is used as their secret', async () => {
  const token = jwt.sign({ sub: 'u1' }, { secret: 'attacker-secret', algorithm: 'HS256' });
  expect((await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${token}` } })).statusCode).toBe(401);
  expect(mocks.key).not.toHaveBeenCalled();
});
it('fails closed when a signing key cannot be fetched', async () => {
  mocks.key.mockRejectedValue(new Error('unknown kid'));
  expect((await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${mint()}` } })).statusCode).toBe(401);
  expect(mocks.user).not.toHaveBeenCalled();
});
it('rejects revoked Cognito tokens even when their JWT signature is valid', async () => {
  mocks.cognito.mockRejectedValue(new Error('revoked'));
  expect((await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${mint()}` } })).statusCode).toBe(401);
  expect(mocks.user).not.toHaveBeenCalled();
});
it('rejects a Cognito user whose subject differs from the JWT', async () => {
  mocks.cognito.mockResolvedValue({ sub: 'another-user' });
  expect((await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${mint()}` } })).statusCode).toBe(401);
});
it('rejects suspended or deleted DB users despite a valid Cognito session', async () => {
  mocks.user.mockResolvedValue(null);
  expect((await app.inject({ method: 'GET', url: '/api/auth/check', headers: { authorization: `Bearer ${mint()}` } })).statusCode).toBe(401);
});
it('requires the latest DB admin role for new page-data endpoints', async () => {
  mocks.user.mockResolvedValue(null);
  expect((await app.inject({ method: 'GET', url: '/api/admin/settings', headers: { authorization: `Bearer ${mint()}` } })).statusCode).toBe(403);
  expect(mocks.user).toHaveBeenCalledWith({ where: { id: 'u1', status: 'ACTIVE', role: 'ADMIN' }, select: { id: true, role: true } });
  expect(mocks.department).not.toHaveBeenCalled();
  mocks.user.mockResolvedValue({ id: 'u1', role: 'ADMIN' });
  const allowed = await app.inject({ method: 'GET', url: '/api/admin/settings', headers: { authorization: `Bearer ${mint()}` } });
  expect(allowed.statusCode).toBe(200);
  expect(allowed.json()).toEqual({ departments: [] });
});
it.each(['/home', '/activity', '/bookmarks', '/search', '/auth/check'])('protects direct calls to %s without Next.js', async (path) => {
  expect((await app.inject({ method: 'GET', url: `/api${path}` })).statusCode).toBe(401);
  expect(mocks.user).not.toHaveBeenCalled();
});
it.each(['/admin/dashboard', '/admin/settings', '/admin/audit-logs'])('protects direct admin calls to %s', async (path) => {
  expect((await app.inject({ method: 'GET', url: `/api${path}` })).statusCode).toBe(403);
});

it('serves liveness without authenticating or accessing the database', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/health' });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ status: 'ok' });
  expect(mocks.user).not.toHaveBeenCalled();
});
