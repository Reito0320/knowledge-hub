import { getCurrentUser } from '@/lib/auth/get-current-user';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  FiBookOpen,
  FiBriefcase,
  FiClock,
  FiEye,
  FiHeart,
  FiMail,
  FiMessageCircle,
  FiSearch,
  FiTag,
} from 'react-icons/fi';
import { getTagColorClass } from '@/lib/tag/get-tag-color-class';
import { createOptionalProfileImageViewUrl } from '@/lib/AWS/s3-presigned-url';
import { AnimatedList, AnimatedListItem } from '@/comp/AnimatedList';
import MemberSearchControls from './_components/MemberSearchControls';
import FavoriteUserButton from './_components/FavoriteUserButton';
import Image from 'next/image';
import UserAvatar from '@/comp/UserAvatar';

type SearchParamValue = string | string[] | undefined;

type SearchPageProps = {
  searchParams: Promise<{
    q?: SearchParamValue;
    category?: SearchParamValue;
    member?: SearchParamValue;
    memberId?: SearchParamValue;
    tag?: SearchParamValue;
    page?: SearchParamValue;
  }>;
};

const getFirstSearchParam = (value: SearchParamValue) => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

const categoryLabels = {
  TECH: '技術ブログ',
  BUSINESS: '業務・カルチャー',
} as const;

const dateFormatter = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});
const pageSize = 20;

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  /* qはHomeの検索窓からのキーワード */
  /* categoryは記事カテゴリの絞り込み */
  /* memberはHeaderのメンバー検索窓からのキーワード */
  /* 何もない場合は最新記事の一覧を表示する想定 */
  const params = await searchParams;

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

  const currentUserId = await getCurrentUser();
  if (!currentUserId) redirect('/login');
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

    return (
      <main className="min-h-[calc(100vh-4rem)] bg-[#F7F6F3] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <header>
            <div className="flex items-center gap-2 text-sm font-bold text-[#B26936]">
              {tag ? <FiTag aria-hidden="true" /> : <FiSearch aria-hidden="true" />}
              {tag ? 'Tag Search' : 'Knowledge Search'}
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#454A52] sm:text-3xl">
              {tag
                ? selectedTag ? `#${selectedTag.name} の記事` : 'タグが見つかりませんでした'
                : `「${keyword}」の検索結果`}
            </h1>
            <p className="mt-2 text-sm text-[#7B8899]">
              {tag && !selectedTag
                ? '指定されたタグは存在しないか、削除されています。'
                : `公開記事 ${visiblePosts.length}件を表示${page > 1 ? `（${page}ページ目）` : ''}`}
            </p>
          </header>

          {(!tag || selectedTag) && (
            <nav aria-label="記事カテゴリ" className="mt-6 flex flex-wrap gap-2">
              {[
                { value: '', label: 'すべて' },
                { value: 'TECH', label: '技術ブログ' },
                { value: 'BUSINESS', label: '業務・カルチャー' },
              ].map(({ value, label }) => (
                <Link
                  key={value || 'ALL'}
                  href={`/search?${tag ? `tag=${encodeURIComponent(tag)}` : `q=${encodeURIComponent(keyword)}`}${value ? `&category=${value}` : ''}`}
                  aria-current={selectedCategory === value ? 'page' : undefined}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition ${selectedCategory === value ? 'bg-[#A66334] text-white' : 'border border-[#E3D9CF] bg-white text-[#70675F] hover:bg-[#FFF3E8]'}`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          )}

          {visiblePosts.length === 0 ? (
            <section className="mt-7 rounded-2xl border border-dashed border-[#CBD5E0] bg-white px-6 py-16 text-center">
              <FiSearch aria-hidden="true" className="mx-auto size-8 text-[#8A97A8]" />
              <h2 className="mt-4 text-lg font-bold text-[#1E3A5F]">
                {tag && !selectedTag ? '別のタグをお試しください' : '該当する公開記事はありません'}
              </h2>
              {selectedCategory && (!tag || selectedTag) && (
                <Link href={`/search?${tag ? `tag=${encodeURIComponent(tag)}` : `q=${encodeURIComponent(keyword)}`}`} className="mt-3 inline-block text-sm font-bold text-[#254F8F] hover:underline">
                  すべてのカテゴリを見る
                </Link>
              )}
            </section>
          ) : (
            <AnimatedList className="mt-7 space-y-4">
              {visiblePosts.map((post) => (
                <AnimatedListItem key={post.id}>
                  <article className="rounded-2xl border border-[#E3DDD6] bg-white p-5 shadow-[0_12px_30px_rgba(72,48,30,0.05)] sm:p-6">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-[#66758A]">
                      <span className="rounded-full bg-[#E8F0FA] px-2.5 py-1 text-[#254F8F]">{categoryLabels[post.category]}</span>
                      <span>{post.author.name}</span>
                      <span className="flex items-center gap-1"><FiClock aria-hidden="true" />{dateFormatter.format(new Date(post.publishedAt ?? post.updatedAt))}</span>
                    </div>
                    <h2 className="mt-3 text-lg font-bold text-[#1E3A5F] hover:text-[#254F8F]">
                      <Link href={`/post/${post.id}`}>{post.title}</Link>
                    </h2>
                    {post.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66758A]">{post.excerpt}</p>}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {post.postTags.map(({ tag: postTag }) => (
                        <Link key={postTag.id} href={`/search?tag=${encodeURIComponent(postTag.slug)}`} className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${getTagColorClass(postTag.name)}`}>
                          <FiTag aria-hidden="true" />{postTag.name}
                        </Link>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[#7B8899]">
                      <span className="flex items-center gap-1"><FiEye aria-hidden="true" />{post.viewCount}</span>
                      <span className="flex items-center gap-1"><FiHeart aria-hidden="true" />{post._count.likes}</span>
                      <span className="flex items-center gap-1"><FiMessageCircle aria-hidden="true" />{post._count.comments}</span>
                      <Link href={`/post/${post.id}`} className="ml-auto inline-flex items-center gap-1 font-bold text-[#254F8F] hover:underline"><FiBookOpen aria-hidden="true" />記事を読む</Link>
                    </div>
                  </article>
                </AnimatedListItem>
              ))}
            </AnimatedList>
          )}
          {(page > 1 || hasNextPage) && (
            <nav aria-label="検索結果のページ" className="mt-8 flex items-center justify-center gap-4 text-sm font-bold">
              {page > 1 && <Link href={`${searchBase}${page > 2 ? `&page=${page - 1}` : ''}`} className="rounded-xl border border-[#E3D9CF] bg-white px-4 py-2 text-[#254F8F] hover:bg-[#FFF3E8]">前のページ</Link>}
              <span className="text-[#66758A]">{page}ページ目</span>
              {hasNextPage && <Link href={`${searchBase}&page=${page + 1}`} className="rounded-xl border border-[#E3D9CF] bg-white px-4 py-2 text-[#254F8F] hover:bg-[#FFF3E8]">次のページ</Link>}
            </nav>
          )}
        </div>
      </main>
    );
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

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F7F6F3] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <header>
          <div className="flex items-center gap-2 text-sm font-bold text-[#B26936]">
            <FiSearch aria-hidden="true" />
            Member Search
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#454A52] sm:text-3xl">
            メンバーの投稿を探す
          </h1>
          <p className="mt-2 text-sm text-[#7B8899]">
            {member
              ? `「${member}」に一致したメンバーと公開記事を表示しています。`
              : '社内のメンバーと、それぞれが公開しているナレッジを一覧で確認できます。'}
          </p>
        </header>
        <MemberSearchControls member={member} memberId={memberId} category={selectedCategory} />

        {members.length === 0 ? (
          <section className="mt-7 flex min-h-72 flex-col items-center justify-center rounded-2xl border border-dashed border-[#CBD5E0] bg-white px-6 text-center">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-[#F1F4F7] text-[#7B8899]">
              <FiSearch aria-hidden="true" className="size-6" />
            </span>
            <h2 className="mt-4 text-lg font-bold text-[#1E3A5F]">
              一致するメンバーが見つかりませんでした
            </h2>
            <p className="mt-2 text-sm text-[#7B8899]">
              名前を短くするか、表記を変えて検索してください。
            </p>
          </section>
        ) : (
          <div className="mt-7">
            <p className="text-sm font-semibold text-[#66758A]">
              このページのメンバー{members.length}名・公開記事{postCount}件
            </p>

            <AnimatedList className="mt-8 space-y-8">
              {members.map((targetMember) => {
              const initials = targetMember.name.trim().slice(0, 1) || 'U';

              return (
                <AnimatedListItem key={targetMember.id}>
                  <section className="overflow-hidden rounded-2xl border border-[#E3DDD6] bg-white shadow-[0_12px_30px_rgba(72,48,30,0.05)]">
                  <header className="border-b border-[#EEE8E1] bg-[#FCFAF7] p-5 sm:p-6">
                    <div className="flex items-start gap-4">
                      <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8F0FA] text-base font-bold text-[#254F8F]">
                        {targetMember.photoUrl ? (
                          <Image
                            src={targetMember.photoUrl}
                            alt={`${targetMember.name}のプロフィール画像`}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          initials
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg font-bold text-[#1E3A5F]">
                          {targetMember.name}
                        </h2>
                        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7B8899]">
                          {targetMember.department && (
                            <span className="flex items-center gap-1.5">
                              <FiBriefcase aria-hidden="true" />
                              {targetMember.department.name}
                            </span>
                          )}
                          {targetMember.jobTitle && (
                            <span>{targetMember.jobTitle}</span>
                          )}
                          <a
                            href={`mailto:${targetMember.email}`}
                            className="flex items-center gap-1.5 hover:text-[#254F8F]"
                          >
                            <FiMail aria-hidden="true" />
                            {targetMember.email}
                          </a>
                        </div>
                        {targetMember.bio && (
                          <p className="mt-3 text-sm leading-6 text-[#66758A]">
                            {targetMember.bio}
                          </p>
                        )}
                      </div>
                      <FavoriteUserButton
                        userId={targetMember.id}
                        userName={targetMember.name}
                        initialFavorited={targetMember.favoritedBy.length > 0}
                      />
                    </div>
                  </header>

                  {targetMember.posts.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-[#8A97A8] sm:px-6">
                      公開中の記事はまだありません。
                    </div>
                  ) : (
                    <div className="divide-y divide-[#EEF1F4]">
                      {targetMember.posts.map((post) => (
                        <article key={post.id} className="p-5 sm:p-6">
                          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#66758A]">
                            <UserAvatar
                              name={targetMember.name}
                              photoUrl={targetMember.photoUrl}
                              size={28}
                            />
                            {targetMember.name}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            <span className="rounded-full bg-[#E8F0FA] px-2.5 py-1 font-bold text-[#254F8F]">
                              {categoryLabels[post.category]}
                            </span>
                            <span className="flex items-center gap-1 text-[#8A97A8]">
                              <FiClock aria-hidden="true" />
                              {dateFormatter.format(
                                new Date(post.publishedAt ?? post.updatedAt),
                              )}
                            </span>
                          </div>

                          <h3 className="mt-3 text-lg font-bold leading-7 text-[#1E3A5F] transition hover:text-[#254F8F]">
                            <Link href={`/post/${post.id}`}>{post.title}</Link>
                          </h3>
                          {post.excerpt && (
                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-[#66758A]">
                              {post.excerpt}
                            </p>
                          )}

                          <div className="mt-4 flex flex-wrap gap-2">
                            {post.postTags.map(({ tag }) => (
                              <span
                                key={tag.id}
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium ${getTagColorClass(tag.name)}`}
                              >
                                <FiTag aria-hidden="true" />
                                {tag.name}
                              </span>
                            ))}
                          </div>

                          <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[#7B8899]">
                            <span className="flex items-center gap-1.5">
                              <FiEye aria-hidden="true" />
                              {post.viewCount}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <FiHeart aria-hidden="true" />
                              {post._count.likes}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <FiMessageCircle aria-hidden="true" />
                              {post._count.comments}
                            </span>
                            <Link
                              href={`/post/${post.id}`}
                              className="ml-auto inline-flex items-center gap-1.5 font-bold text-[#254F8F] hover:underline"
                            >
                              <FiBookOpen aria-hidden="true" />
                              記事を読む
                            </Link>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                  </section>
                </AnimatedListItem>
              );
              })}
            </AnimatedList>
          </div>
        )}

        {(page > 1 || hasNextMemberPage) && (
          <nav aria-label="メンバー検索結果のページ" className="mt-8 flex items-center justify-center gap-4 text-sm font-bold">
            {page > 1 && (
              <Link href={`/search?${new URLSearchParams({ ...(memberId ? { memberId } : member ? { member } : {}), ...(selectedCategory ? { category: selectedCategory } : {}), ...(page > 2 ? { page: String(page - 1) } : {}) })}`} className="rounded-xl border border-[#E3D9CF] bg-white px-4 py-2 text-[#254F8F] hover:bg-[#FFF3E8]">前のページ</Link>
            )}
            <span className="text-[#66758A]">{page}ページ目</span>
            {hasNextMemberPage && (
              <Link href={`/search?${new URLSearchParams({ ...(memberId ? { memberId } : member ? { member } : {}), ...(selectedCategory ? { category: selectedCategory } : {}), page: String(page + 1) })}`} className="rounded-xl border border-[#E3D9CF] bg-white px-4 py-2 text-[#254F8F] hover:bg-[#FFF3E8]">次のページ</Link>
            )}
          </nav>
        )}

      </div>
    </main>
  );
};

export default SearchPage;
