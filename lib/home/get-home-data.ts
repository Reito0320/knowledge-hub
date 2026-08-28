import 'server-only';
import { prisma } from '@/lib/prisma';

export type HomePost = {
  id: string;
  title: string;
  excerpt: string | null;
  category: 'TECH' | 'BUSINESS';
  publishedAt: string | null;
  author: {
    name: string;
    email: string;
    department: { name: string } | null;
  };
  postTags: Array<{ tag: { id: string; name: string } }>;
  _count: {
    likes: number;
    comments: number;
  };
};

export type HomeMember = {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  department: { name: string } | null;
  _count: { posts: number };
};

const postSelect = {
  id: true,
  title: true,
  excerpt: true,
  category: true,
  publishedAt: true,
  author: {
    select: {
      name: true,
      email: true,
      department: {
        select: { name: true },
      },
    },
  },
  postTags: {
    select: {
      tag: {
        select: { id: true, name: true },
      },
    },
  },
  _count: {
    select: {
      likes: true,
      comments: true,
    },
  },
} as const;

const serializePost = (post: Omit<HomePost, 'publishedAt'> & { publishedAt: Date | null }): HomePost => ({
  ...post,
  publishedAt: post.publishedAt?.toISOString() ?? null,
});

export const getHomeData = async () => {
  const [
    publishedPostCount,
    postingMemberCount,
    departmentCount,
    techPostCount,
    businessPostCount,
    popularPosts,
    latestPosts,
    trendingTags,
    featuredMembers,
  ] = await prisma.$transaction([
    prisma.post.count({ where: { status: 'PUBLISHED' } }),
    prisma.user.count({
      where: { posts: { some: { status: 'PUBLISHED' } } },
    }),
    prisma.department.count({
      where: {
        members: { some: { posts: { some: { status: 'PUBLISHED' } } } },
      },
    }),
    prisma.post.count({ where: { status: 'PUBLISHED', category: 'TECH' } }),
    prisma.post.count({
      where: { status: 'PUBLISHED', category: 'BUSINESS' },
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { publishedAt: 'desc' },
      ],
      take: 3,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: postSelect,
    }),
    prisma.tag.findMany({
      where: {
        postTags: { some: { post: { status: 'PUBLISHED' } } },
      },
      orderBy: { postTags: { _count: 'desc' } },
      take: 8,
      select: { id: true, name: true, slug: true },
    }),
    prisma.user.findMany({
      where: { posts: { some: { status: 'PUBLISHED' } } },
      orderBy: { posts: { _count: 'desc' } },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        department: { select: { name: true } },
        _count: {
          select: { posts: { where: { status: 'PUBLISHED' } } },
        },
      },
    }),
  ]);

  return {
    stats: {
      publishedPostCount,
      postingMemberCount,
      departmentCount,
    },
    categoryCounts: {
      TECH: techPostCount,
      BUSINESS: businessPostCount,
    },
    popularPosts: popularPosts.map(serializePost),
    latestPosts: latestPosts.map(serializePost),
    trendingTags,
    featuredMembers,
  };
};
