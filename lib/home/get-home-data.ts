import 'server-only';
import { prisma } from '@/lib/prisma';
import { createOptionalProfileImageViewUrl } from '@/lib/AWS/s3-presigned-url';

export type HomePost = {
  id: string;
  title: string;
  excerpt: string | null;
  category: 'TECH' | 'BUSINESS';
  publishedAt: string | null;
  author: {
    name: string;
    email: string;
    photoUrl: string | null;
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
  photoUrl: string | null;
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
      photoObjectKey: true,
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
  // 相互依存しない読み取りはtransactionで直列化せず、並列実行して待ち時間を短縮する。
  ] = await Promise.all([
    prisma.post.count({ where: { status: 'PUBLISHED', visibility: 'ORGANIZATION' } }),
    prisma.user.count({
      where: { posts: { some: { status: 'PUBLISHED', visibility: 'ORGANIZATION' } } },
    }),
    prisma.department.count({
      where: {
        members: { some: { posts: { some: { status: 'PUBLISHED', visibility: 'ORGANIZATION' } } } },
      },
    }),
    prisma.post.count({ where: { status: 'PUBLISHED', visibility: 'ORGANIZATION', category: 'TECH' } }),
    prisma.post.count({
      where: { status: 'PUBLISHED', visibility: 'ORGANIZATION', category: 'BUSINESS' },
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED', visibility: 'ORGANIZATION' },
      orderBy: [
        { likes: { _count: 'desc' } },
        { comments: { _count: 'desc' } },
        { publishedAt: 'desc' },
      ],
      take: 3,
      select: postSelect,
    }),
    prisma.post.findMany({
      where: { status: 'PUBLISHED', visibility: 'ORGANIZATION' },
      orderBy: { publishedAt: 'desc' },
      take: 10,
      select: postSelect,
    }),
    prisma.tag.findMany({
      where: {
        postTags: { some: { post: { status: 'PUBLISHED', visibility: 'ORGANIZATION' } } },
      },
      orderBy: { postTags: { _count: 'desc' } },
      take: 8,
      select: { id: true, name: true, slug: true },
    }),
    prisma.user.findMany({
      where: { posts: { some: { status: 'PUBLISHED', visibility: 'ORGANIZATION' } } },
      orderBy: { posts: { _count: 'desc' } },
      take: 6,
      select: {
        id: true,
        name: true,
        email: true,
        jobTitle: true,
        photoObjectKey: true,
        department: { select: { name: true } },
        _count: {
          select: { posts: { where: { status: 'PUBLISHED' } } },
        },
      },
    }),
  ]);

  const serializePost = async (post: (typeof popularPosts)[number]) => {
    const photoUrl = await createOptionalProfileImageViewUrl(
      post.author.photoObjectKey,
    );

    return {
      ...post,
      publishedAt: post.publishedAt?.toISOString() ?? null,
      author: {
        ...post.author,
        photoObjectKey: undefined,
        photoUrl,
      },
    };
  };

  const serializeMember = async (member: (typeof featuredMembers)[number]) => {
    const photoUrl = await createOptionalProfileImageViewUrl(
      member.photoObjectKey,
    );

    return {
      ...member,
      photoObjectKey: undefined,
      photoUrl,
    };
  };

  const [serializedPopularPosts, serializedLatestPosts, serializedMembers] =
    await Promise.all([
      Promise.all(popularPosts.map(serializePost)),
      Promise.all(latestPosts.map(serializePost)),
      Promise.all(featuredMembers.map(serializeMember)),
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
    popularPosts: serializedPopularPosts,
    latestPosts: serializedLatestPosts,
    trendingTags,
    featuredMembers: serializedMembers,
  };
};
