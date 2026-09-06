import 'server-only';
import { prisma } from '@/lib/prisma';

export const getAdminAnalytics = async () => {
  const now = new Date();
  const since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const dateKeyFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const shortDateFormatter = new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
  });

  const [
    allPosts,
    publishedPostCount,
    draftPostCount,
    archivedPostCount,
    techPostCount,
    businessPostCount,
    likeCount,
    commentCount,
    bookmarkCount,
    contributorCount,
    recentPosts,
    topPosts,
    topContributors,
  ] = await Promise.all([
    prisma.post.aggregate({ _count: true, _sum: { viewCount: true } }),
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.post.count({ where: { status: 'DRAFT' } }),
    prisma.post.count({ where: { status: 'ARCHIVED' } }),
    prisma.post.count({ where: { status: 'PUBLISHED', category: 'TECH' } }),
    prisma.post.count({ where: { status: 'PUBLISHED', category: 'BUSINESS' } }),
    prisma.postLike.count(),
    prisma.comment.count(),
    prisma.bookmark.count(),
    prisma.user.count({ where: { posts: { some: { status: 'PUBLISHED' } } } }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED', publishedAt: { gte: since } },
      select: { publishedAt: true },
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [
        { viewCount: 'desc' },
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
      ],
      take: 5,
      select: {
        id: true,
        title: true,
        viewCount: true,
        author: { select: { name: true } },
        _count: { select: { likes: true, comments: true, bookmarks: true } },
      },
    }),
    prisma.user.findMany({
      where: { posts: { some: { status: 'PUBLISHED' } } },
      orderBy: { posts: { _count: 'desc' } },
      take: 5,
      select: {
        id: true,
        name: true,
        department: { select: { name: true } },
        _count: { select: { posts: { where: { status: 'PUBLISHED' } } } },
      },
    }),
  ]);

  const dailyPublications = Array.from({ length: 30 }, (_, index) => {
    const date = new Date(now.getTime() - (29 - index) * 24 * 60 * 60 * 1000);
    const key = dateKeyFormatter.format(date);
    return { key, label: shortDateFormatter.format(date), count: 0 };
  });
  const dayMap = new Map(dailyPublications.map((day) => [day.key, day]));
  recentPosts.forEach(({ publishedAt }) => {
    if (!publishedAt) return;
    const day = dayMap.get(dateKeyFormatter.format(publishedAt));
    if (day) day.count += 1;
  });

  return {
    totalPostCount: allPosts._count,
    totalViewCount: allPosts._sum.viewCount ?? 0,
    publishedPostCount,
    draftPostCount,
    archivedPostCount,
    techPostCount,
    businessPostCount,
    likeCount,
    commentCount,
    bookmarkCount,
    contributorCount,
    dailyPublications,
    topPosts,
    topContributors,
  };
};

export type AdminAnalyticsData = Awaited<ReturnType<typeof getAdminAnalytics>>;
