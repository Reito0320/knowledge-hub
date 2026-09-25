import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
const mocks = vi.hoisted(() => {
  const model = () => ({ findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn() });
  return { user: model(), post: model(), department: model(), tag: model(), bookmark: model(),
    userFavorite: model(), comment: model(), postLike: model(), adminAuditLog: model() };
});
vi.mock('@/server/src/infrastructure/prisma', () => ({ prisma: { ...mocks, $disconnect: vi.fn() } }));
vi.mock('@/server/src/infrastructure/aws/s3-presigned-url', () => ({ createOptionalProfileImageViewUrl: async () => null }));
import { AuthService } from './src/auth/auth.service';
import { createApp } from './src/app';
let app: NestFastifyApplication;
const headers = { authorization: 'Bearer test-token' };
const date = new Date('2026-09-24T00:00:00Z');
beforeAll(async () => {
  app = await createApp({ logger: false });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});
afterAll(async () => { await app.close(); });
beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(AuthService.prototype, 'verifyAccessToken').mockResolvedValue({
    accessToken: 'test-token', payload: { sub: 'viewer', exp: 9999999999, iss: 'test', client_id: 'test', token_use: 'access' },
    cognitoUser: { sub: 'viewer', name: 'Viewer', email: 'v@example.com', emailVerified: true },
  });
  for (const model of Object.values(mocks)) {
    model.findMany.mockResolvedValue([]);
    model.count.mockResolvedValue(0);
  }
  mocks.user.findFirst.mockResolvedValue({ id: 'viewer', role: 'MEMBER' });
  mocks.user.findUnique.mockResolvedValue({ departmentId: 'dept-1' });
});

it('serves the home dashboard entirely through the authenticated API', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/home', headers });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ stats: { publishedPostCount: 0, postingMemberCount: 0, departmentCount: 0 },
    categoryCounts: { TECH: 0, BUSINESS: 0 }, popularPosts: [], latestPosts: [], trendingTags: [], featuredMembers: [] });
  expect(mocks.post.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'PUBLISHED', visibility: 'ORGANIZATION' } }));
  expect(response.headers['cache-control']).toBe('private, no-store');
});
it('returns the latest comment per article in descending order with JSON dates', async () => {
  const post = (id: string) => ({ id, title: id, excerpt: null, author: { name: 'Author', photoObjectKey: null } });
  mocks.comment.findMany.mockResolvedValue([
    { content: 'latest', createdAt: date, post: post('p1') },
    { content: 'other', createdAt: new Date('2026-09-23'), post: post('p2') },
    { content: 'old', createdAt: new Date('2026-09-22'), post: post('p1') },
  ]);
  const response = await app.inject({ method: 'GET', url: '/api/activity', headers });
  expect(response.statusCode).toBe(200);
  expect(response.json().commentedArticles.map((item: { postId: string }) => item.postId)).toEqual(['p1', 'p2']);
  expect(response.json().commentedArticles[0]).toMatchObject({ note: 'コメント: latest', occurredAt: date.toISOString() });
  expect(mocks.comment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ authorId: 'viewer' }) }));
});
it('restricts bookmarks to the viewer and currently visible published posts', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/bookmarks', headers });
  expect(response.statusCode).toBe(200);
  expect(mocks.bookmark.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
    userId: 'viewer', post: { status: 'PUBLISHED', OR: [
      { authorId: 'viewer' }, { visibility: 'ORGANIZATION' }, { visibility: 'LINK' },
      { visibility: 'DEPARTMENT', author: { departmentId: 'dept-1' } },
    ] },
  } }));
  expect(response.json()).toEqual({ bookmarks: [], favoriteUsers: [] });
});
it('paginates text search in the API and serializes dates', async () => {
  mocks.post.findMany.mockResolvedValue(Array.from({ length: 21 }, (_, i) => ({
    id: String(i), title: 'hello', excerpt: null, category: 'TECH', publishedAt: date, updatedAt: date,
    viewCount: 0, author: { name: 'Author' }, postTags: [], _count: { likes: 0, comments: 0 },
  })));
  const response = await app.inject({ method: 'GET', url: '/api/search?q=hello&page=2&category=TECH', headers });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ kind: 'posts', page: 2, hasNextPage: true, keyword: 'hello' });
  expect(response.json().visiblePosts).toHaveLength(20);
  expect(response.json().visiblePosts[0].publishedAt).toBe(date.toISOString());
  expect(mocks.post.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 20, take: 21,
    where: expect.objectContaining({ category: 'TECH', status: 'PUBLISHED' }) }));
});
it('normalizes invalid pages and filters member posts by department visibility', async () => {
  const response = await app.inject({ method: 'GET', url: '/api/search?member=Alice&page=-1', headers });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ kind: 'members', page: 1, members: [], postCount: 0 });
  expect(mocks.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: {
    status: 'ACTIVE', id: { not: 'viewer' }, name: { contains: 'Alice', mode: 'insensitive' },
  }, select: expect.objectContaining({ posts: expect.objectContaining({ where: {
    status: 'PUBLISHED', OR: [{ visibility: 'ORGANIZATION' }, { visibility: 'DEPARTMENT', author: { departmentId: 'dept-1' } }],
  } }) }) }));
});
it('serves an admin dashboard with the authenticated administrator ID', async () => {
  mocks.user.findFirst.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  const response = await app.inject({ method: 'GET', url: '/api/admin/dashboard?q=Alice&role=MEMBER', headers });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toMatchObject({ admin: { id: 'admin' }, keyword: 'Alice', selectedRole: 'MEMBER', users: [], analytics: null });
});
it('rejects prototype property names as audit filter enum values', async () => {
  mocks.user.findFirst.mockResolvedValue({ id: 'admin', role: 'ADMIN' });
  const response = await app.inject({ method: 'GET', url: '/api/admin/audit-logs?action=__proto__&status=toString', headers });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ action: '', status: '', logs: [], users: [] });
  expect(mocks.adminAuditLog.findMany).toHaveBeenCalledWith({ where: {}, orderBy: { createdAt: 'desc' }, take: 100 });
});
