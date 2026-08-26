import Link from 'next/link';
import {
  FiArrowRight,
  FiBriefcase,
  FiClock,
  FiCode,
  FiHeart,
  FiMail,
  FiMessageCircle,
  FiTag,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import FirstSection from './_comp/FirstSection';

const popularArticles = [
  {
    rank: 1,
    category: '技術ブログ',
    title: 'Next.js App Router移行で学んだ、チーム開発の設計ポイント',
    excerpt:
      '認証・キャッシュ・Route Handlerの責務をどう整理したか、実装例とともに共有します。',
    tags: ['Next.js', '設計', '認証'],
    author: {
      initials: 'ST',
      name: '佐藤 拓海',
      department: 'プロダクト開発部',
      email: 'takumi.sato@company.co.jp',
      color: 'bg-[#DCE9F7] text-[#254F8F]',
    },
    likes: 48,
    comments: 12,
    publishedAt: '2日前',
  },
  {
    rank: 2,
    category: '技術ブログ',
    title: '障害対応の初動を速くするために整えたチェックリスト',
    excerpt:
      '深夜対応で迷わないための確認項目と、情報を残すときに意識していることをまとめました。',
    tags: ['SRE', '運用', '障害対応'],
    author: {
      initials: 'MK',
      name: '森川 健',
      department: '基盤システム部',
      email: 'ken.morikawa@company.co.jp',
      color: 'bg-[#E4F1EA] text-[#39745A]',
    },
    likes: 37,
    comments: 9,
    publishedAt: '4日前',
  },
  {
    rank: 3,
    category: '業務・カルチャー',
    title: '新入社員が最初の30日で知っておきたい社内の進め方',
    excerpt:
      '相談先の見つけ方、会議の準備、ドキュメント文化など、入社直後に役立った知識です。',
    tags: ['オンボーディング', '仕事術'],
    author: {
      initials: 'AO',
      name: '大野 葵',
      department: '人材開発部',
      email: 'aoi.ono@company.co.jp',
      color: 'bg-[#F8E9DC] text-[#A35F2D]',
    },
    likes: 31,
    comments: 15,
    publishedAt: '1週間前',
  },
];

const latestArticles = [
  {
    category: '業務・カルチャー',
    title: 'プロジェクト開始時に合意しておくと助かる5つのこと',
    author: '高橋 美咲',
    department: 'PMO',
    initials: 'MT',
    tags: ['プロジェクト管理', 'チーム'],
    likes: 18,
    comments: 4,
    publishedAt: '3時間前',
  },
  {
    category: '技術ブログ',
    title: 'Prisma Migrationを本番環境へ安全に反映する流れ',
    author: '山本 翔',
    department: 'Web開発部',
    initials: 'SY',
    tags: ['Prisma', 'PostgreSQL'],
    likes: 24,
    comments: 7,
    publishedAt: '昨日',
  },
  {
    category: '業務・カルチャー',
    title: 'お客様からよく聞かれる質問と、回答時のポイント',
    author: '伊藤 彩',
    department: 'カスタマーサクセス部',
    initials: 'AI',
    tags: ['顧客対応', 'FAQ'],
    likes: 15,
    comments: 3,
    publishedAt: '昨日',
  },
];

const trendingTags = [
  'Next.js',
  'オンボーディング',
  'AWS',
  '業務改善',
  'Prisma',
  '障害対応',
  'React',
  '社内制度',
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1E2A3A]">
      <FirstSection />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-bold text-[#254F8F]">
                  <FiTrendingUp aria-hidden="true" />
                  Popular
                </div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1E3A5F]">
                  人気の記事
                </h2>
                <p className="mt-1 text-sm text-[#7B8899]">
                  いいね・コメントの多いナレッジです
                </p>
              </div>
              <Link
                href="#"
                className="hidden items-center gap-1 text-sm font-semibold text-[#254F8F] hover:underline sm:flex"
              >
                すべて見る
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>

            {/* TODO: usePopularArticlesでいいね数・コメント数を基準に記事を取得する */}
            <div className="mt-5 space-y-4">
              {popularArticles.map((article) => (
                <article
                  key={article.title}
                  className="group rounded-2xl border border-[#E0E6ED] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#254F8F]/25 hover:shadow-[0_14px_35px_rgba(30,58,95,0.08)] sm:p-6"
                >
                  <div className="flex gap-4">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1E3A5F] text-xs font-bold text-white">
                      {article.rank}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${article.category === '技術ブログ' ? 'bg-[#E8F0FA] text-[#254F8F]' : 'bg-[#F8EADF] text-[#995D31]'}`}
                        >
                          {article.category}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-[#8A97A8]">
                          <FiClock aria-hidden="true" />
                          {article.publishedAt}
                        </span>
                      </div>
                      <h3 className="mt-3 text-lg font-bold leading-7 text-[#1E3A5F] transition group-hover:text-[#254F8F]">
                        <Link href="#">{article.title}</Link>
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[#66758A]">
                        {article.excerpt}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {article.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-[#F1F4F7] px-2 py-1 text-[11px] font-medium text-[#657287]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex flex-col gap-4 border-t border-[#EEF1F4] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-center gap-3">
                          {/* TODO: user.photoUrl取得後にnext/imageのプロフィール画像へ置き換える */}
                          <div
                            className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${article.author.color}`}
                          >
                            {article.author.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-x-2">
                              <p className="text-sm font-bold text-[#344256]">
                                {article.author.name}
                              </p>
                              <span className="text-xs text-[#7B8899]">
                                {article.author.department}
                              </span>
                            </div>
                            <a
                              href={`mailto:${article.author.email}`}
                              className="mt-0.5 flex items-center gap-1 truncate text-xs text-[#7B8899] hover:text-[#254F8F]"
                            >
                              <FiMail aria-hidden="true" />
                              {article.author.email}
                            </a>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-semibold text-[#7B8899]">
                          {/* TODO: useToggleLikeでログインユーザーのいいね状態を更新する */}
                          <button
                            type="button"
                            className="flex items-center gap-1.5 transition hover:text-[#C15E67]"
                            aria-label={`${article.title}にいいねする`}
                          >
                            <FiHeart aria-hidden="true" />
                            {article.likes}
                          </button>
                          <span className="flex items-center gap-1.5">
                            <FiMessageCircle aria-hidden="true" />
                            {article.comments}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#E0E6ED] bg-white p-5">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F]">
                <FiTag aria-hidden="true" className="text-[#254F8F]" />
                注目のタグ
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {trendingTags.map((tag) => (
                  <Link
                    key={tag}
                    href="#"
                    className="rounded-lg border border-[#E3E8EE] bg-[#F8FAFC] px-2.5 py-2 text-xs font-medium text-[#5F6D80] transition hover:border-[#254F8F]/30 hover:text-[#254F8F]"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            </section>
            <section className="overflow-hidden rounded-2xl bg-[#1E3A5F] p-5 text-white">
              <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
                <FiUsers aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-lg font-bold">
                誰に聞けばいいか迷ったら
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/70">
                キーワードや部署から、詳しいメンバーと過去の投稿を探せます。
              </p>
              <Link
                href="#"
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white hover:underline"
              >
                メンバーを探す
                <FiArrowRight aria-hidden="true" />
              </Link>
            </section>
            <section className="rounded-2xl border border-[#E0E6ED] bg-white p-5">
              <h2 className="text-sm font-bold text-[#1E3A5F]">
                記事のカテゴリ
              </h2>
              <div className="mt-4 space-y-2">
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl bg-[#EAF1FA] px-3 py-3 text-left text-sm font-semibold text-[#254F8F]"
                >
                  <span className="flex items-center gap-2">
                    <FiCode aria-hidden="true" />
                    技術ブログ
                  </span>
                  <span className="text-xs">214</span>
                </button>
                <button
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl bg-[#FAF1E9] px-3 py-3 text-left text-sm font-semibold text-[#995D31]"
                >
                  <span className="flex items-center gap-2">
                    <FiBriefcase aria-hidden="true" />
                    業務・カルチャー
                  </span>
                  <span className="text-xs">112</span>
                </button>
              </div>
            </section>
          </aside>
        </div>

        <section className="mt-14">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold text-[#254F8F]">Latest</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#1E3A5F]">
                新着ナレッジ
              </h2>
            </div>
            {/* TODO: useArticleFilterで「すべて・技術・業務」の選択状態を管理する */}
            <div className="flex w-fit rounded-xl border border-[#DDE4EC] bg-white p-1 text-xs font-semibold text-[#6B788A]">
              <button
                type="button"
                className="rounded-lg bg-[#254F8F] px-4 py-2 text-white"
              >
                すべて
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 hover:text-[#254F8F]"
              >
                技術
              </button>
              <button
                type="button"
                className="rounded-lg px-4 py-2 hover:text-[#254F8F]"
              >
                業務
              </button>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#E0E6ED] bg-white">
            {latestArticles.map((article, index) => (
              <article
                key={article.title}
                className={`p-5 transition hover:bg-[#F8FAFC] sm:p-6 ${index !== latestArticles.length - 1 ? 'border-b border-[#E9EDF2]' : ''}`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[#254F8F]">
                        {article.category}
                      </span>
                      <span className="text-[#A0A9B5]">•</span>
                      <span className="text-[#8A97A8]">
                        {article.publishedAt}
                      </span>
                    </div>
                    <h3 className="mt-2 font-bold leading-6 text-[#26364A] hover:text-[#254F8F]">
                      <Link href="#">{article.title}</Link>
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#7B8899]">
                      <span className="flex size-7 items-center justify-center rounded-full bg-[#EDF1F5] text-[10px] font-bold text-[#516176]">
                        {article.initials}
                      </span>
                      <span className="font-semibold text-[#566477]">
                        {article.author}
                      </span>
                      <span>{article.department}</span>
                      {article.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded bg-[#F1F4F7] px-1.5 py-1"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-xs font-semibold text-[#7B8899]">
                    <span className="flex items-center gap-1.5">
                      <FiHeart aria-hidden="true" />
                      {article.likes}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <FiMessageCircle aria-hidden="true" />
                      {article.comments}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
