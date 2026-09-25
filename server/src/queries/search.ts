import { prisma } from '@/server/src/infrastructure/prisma';
import { createOptionalProfileImageViewUrl } from '@/server/src/infrastructure/aws/s3-presigned-url';
const getFirstSearchParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? '' : value ?? '';
const pageSize = 20;
export async function getSearchData(params: Record<string, string | string[] | undefined>, currentUserId: string) {
  const keyword = getFirstSearchParam(params.q).trim();
  const category = getFirstSearchParam(params.category);
  const member = getFirstSearchParam(params.member);
  const memberId = getFirstSearchParam(params.memberId);
  const tag = getFirstSearchParam(params.tag);
  const requestedPage = Number(getFirstSearchParam(params.page));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000
    ? requestedPage
    : 1;
  const isMemberDirectory = !keyword && !tag;

  const viewer = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { departmentId: true },
  });

  const selectedCategory =
    category === 'TECH' || category === 'BUSINESS' ? category : '';

  if (tag || keyword) {
    const searchBase = `/search?${tag ? `tag=${encodeURIComponent(tag)}` : `q=${encodeURIComponent(keyword)}`}${selectedCategory ? `&category=${selectedCategory}` : ''}`;
    const selectedTag = tag ? await prisma.tag.findUnique({
      where: { slug: tag },
      select: { id: true, name: true },
    }) : null;
    const posts = (!tag || selectedTag)
      ? await prisma.post.findMany({
          where: {
            status: 'PUBLISHED',
            ...(selectedTag ? { postTags: { some: { tagId: selectedTag.id } } } : {}),
            ...(selectedCategory ? { category: selectedCategory } : {}),
            AND: [
              {
                OR: [
                  { visibility: 'ORGANIZATION' },
                  ...(viewer?.departmentId
                    ? [{ visibility: 'DEPARTMENT' as const, author: { departmentId: viewer.departmentId } }]
                    : []),
                ],
              },
              ...(keyword ? [{ OR: [
                { title: { contains: keyword, mode: 'insensitive' as const } },
                { excerpt: { contains: keyword, mode: 'insensitive' as const } },
                { postTags: { some: { tag: { name: { contains: keyword, mode: 'insensitive' as const } } } } },
              ] }] : []),
            ],
          },
          orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
          skip: (page - 1) * pageSize,
          take: pageSize + 1,
          select: {
            id: true,
            title: true,
            excerpt: true,
            category: true,
            publishedAt: true,
            updatedAt: true,
            viewCount: true,
            author: { select: { name: true } },
            postTags: { select: { tag: { select: { id: true, name: true, slug: true } } } },
            _count: { select: { likes: true, comments: true } },
          },
        })
      : [];
    const hasNextPage = posts.length > pageSize;
    const visiblePosts = posts.slice(0, pageSize);

    return { kind: 'posts' as const, keyword, category, member, memberId, tag, page, selectedCategory, selectedTag, visiblePosts, hasNextPage, searchBase };
  }
  // Headerからメンバー名が送られた場合だけ、Userとその公開記事を取得する。
  // 下書きやアーカイブは投稿者以外へ公開しない。
  const memberRecords = isMemberDirectory
    ? await prisma.user.findMany({
        where: {
          status: 'ACTIVE',
          // 検索結果にもログイン中の本人を含めない。
          id: memberId
            ? {
                equals: memberId,
                not: currentUserId,
              }
            : {
                not: currentUserId,
              },
          ...(memberId
            ? {}
            : member
              ? {
                name: {
                  contains: member,
                  mode: 'insensitive' as const,
                },
                }
              : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          jobTitle: true,
          bio: true,
          photoObjectKey: true,
          department: {
            select: {
              name: true,
            },
          },
          favoritedBy: {
            where: { followerId: currentUserId },
            select: { followerId: true },
            take: 1,
          },
          posts: {
            where: {
              status: 'PUBLISHED',
              OR: [
                { visibility: 'ORGANIZATION' },
                ...(viewer?.departmentId
                  ? [{ visibility: 'DEPARTMENT' as const, author: { departmentId: viewer.departmentId } }]
                  : []),
              ],
              ...(selectedCategory
                ? { category: selectedCategory }
                : {}),
            },
            orderBy: [{ publishedAt: 'desc' }, { updatedAt: 'desc' }],
            take: 20,
            select: {
              id: true,
              title: true,
              excerpt: true,
              category: true,
              viewCount: true,
              publishedAt: true,
              updatedAt: true,
              postTags: {
                select: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
        skip: (page - 1) * pageSize,
        take: pageSize + 1,
      })
    : [];
  const hasNextMemberPage = memberRecords.length > pageSize;

  const members = await Promise.all(
    memberRecords.slice(0, pageSize).map(async (targetMember) => {
      const photoUrl = await createOptionalProfileImageViewUrl(
        targetMember.photoObjectKey,
      );

      return {
        ...targetMember,
        photoObjectKey: undefined,
        photoUrl,
      };
    }),
  );

  const postCount = members.reduce(
    (total, targetMember) => total + targetMember.posts.length,
    0,
  );

  return { kind: 'members' as const, keyword, category, member, memberId, tag, page, selectedCategory, members, hasNextMemberPage, postCount };
}
