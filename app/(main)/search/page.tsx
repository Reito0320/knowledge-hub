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

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  /* qはHomeの検索窓からのキーワード */
  /* categoryはカテゴリ・タグからの絞り込み */
  /* memberはHeaderのメンバー検索窓からのキーワード */
  /* 何もない場合は最新記事の一覧を表示する想定 */
  const params = await searchParams;

  const keyword = getFirstSearchParam(params.q);
  const category = getFirstSearchParam(params.category);
  const member = getFirstSearchParam(params.member);
  const memberId = getFirstSearchParam(params.memberId);
  const tag = getFirstSearchParam(params.tag);
  const isMemberDirectory = !keyword && !tag;

  const currentUserId = await getCurrentUser();
  if (!currentUserId) redirect('/login');
  const viewer = await prisma.user.findUnique({
    where: { id: currentUserId },
    select: { departmentId: true },
  });

  const selectedCategory =
    category === 'TECH' || category === 'BUSINESS' ? category : '';

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
      })
    : [];

  const members = await Promise.all(
    memberRecords.map(async (targetMember) => {
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
              {members.length}名・公開記事{postCount}件
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

        {/* q・category・tagによる記事検索は、メンバー検索と分けて今後追加する。 */}
        {(keyword || category || tag) && !member && (
          <p className="mt-6 text-sm text-[#7B8899]">
            記事・カテゴリ・タグ検索は現在準備中です。
          </p>
        )}
      </div>
    </main>
  );
};

export default SearchPage;
