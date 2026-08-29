export const SEED_DEPARTMENTS = [
  { id: 'seed-department-product', name: 'プロダクト開発部' },
  { id: 'seed-department-platform', name: '基盤システム部' },
  { id: 'seed-department-hr', name: '人材開発部' },
  { id: 'seed-department-pmo', name: 'PMO' },
  { id: 'seed-department-web', name: 'Web開発部' },
  { id: 'seed-department-cs', name: 'カスタマーサクセス部' },
] as const;

export const SEED_USERS = [
  {
    id: 'seed-user-sato',
    email: 'takumi.sato@example.com',
    name: '佐藤 拓海',
    jobTitle: 'フロントエンドエンジニア',
    bio: 'Next.jsと認証設計を中心に、チームの開発基盤を整えています。',
    departmentId: 'seed-department-product',
  },
  {
    id: 'seed-user-morikawa',
    email: 'ken.morikawa@example.com',
    name: '森川 健',
    jobTitle: 'SRE',
    bio: '障害対応と運用改善を担当しています。',
    departmentId: 'seed-department-platform',
  },
  {
    id: 'seed-user-ono',
    email: 'aoi.ono@example.com',
    name: '大野 葵',
    jobTitle: '人材開発',
    bio: 'オンボーディングと社内研修を担当しています。',
    departmentId: 'seed-department-hr',
  },
  {
    id: 'seed-user-takahashi',
    email: 'misaki.takahashi@example.com',
    name: '高橋 美咲',
    jobTitle: 'プロジェクトマネージャー',
    bio: 'プロジェクトの進行とチーム間の調整を担当しています。',
    departmentId: 'seed-department-pmo',
  },
  {
    id: 'seed-user-yamamoto',
    email: 'sho.yamamoto@example.com',
    name: '山本 翔',
    jobTitle: 'バックエンドエンジニア',
    bio: 'PrismaとPostgreSQLを使ったAPI開発を担当しています。',
    departmentId: 'seed-department-web',
  },
  {
    id: 'seed-user-ito',
    email: 'aya.ito@example.com',
    name: '伊藤 彩',
    jobTitle: 'カスタマーサクセス',
    bio: '顧客対応で得た知見を社内へ共有しています。',
    departmentId: 'seed-department-cs',
  },
] as const;

export const SEED_TAGS = [
  { id: 'seed-tag-nextjs', name: 'Next.js', slug: 'nextjs' },
  { id: 'seed-tag-react', name: 'React', slug: 'react' },
  { id: 'seed-tag-typescript', name: 'TypeScript', slug: 'typescript' },
  { id: 'seed-tag-prisma', name: 'Prisma', slug: 'prisma' },
  { id: 'seed-tag-cognito', name: 'Cognito', slug: 'cognito' },
  { id: 'seed-tag-aws', name: 'AWS', slug: 'aws' },
  { id: 'seed-tag-auth', name: '認証', slug: 'authentication' },
  { id: 'seed-tag-design', name: '設計', slug: 'design' },
  { id: 'seed-tag-sre', name: 'SRE', slug: 'sre' },
  { id: 'seed-tag-operation', name: '運用', slug: 'operation' },
  { id: 'seed-tag-incident', name: '障害対応', slug: 'incident-response' },
  { id: 'seed-tag-onboarding', name: 'オンボーディング', slug: 'onboarding' },
  { id: 'seed-tag-work', name: '仕事術', slug: 'work-skills' },
  { id: 'seed-tag-project', name: 'プロジェクト管理', slug: 'project-management' },
  { id: 'seed-tag-team', name: 'チーム', slug: 'team' },
  { id: 'seed-tag-postgresql', name: 'PostgreSQL', slug: 'postgresql' },
  { id: 'seed-tag-customer', name: '顧客対応', slug: 'customer-support' },
  { id: 'seed-tag-faq', name: 'FAQ', slug: 'faq' },
] as const;

export const SEED_POSTS = [
  {
    id: 'seed-post-nextjs-design',
    authorId: 'seed-user-sato',
    title: 'Next.js App Router移行で学んだ、チーム開発の設計ポイント',
    excerpt:
      '認証・キャッシュ・Route Handlerの責務をどう整理したか、実装例とともに共有します。',
    content:
      '## 背景\n\nApp Routerへの移行で整理した責務と、Server Componentを基本にする設計方針をまとめます。\n\n## 学び\n\n- DB処理はServer側へ置く\n- Client Componentは操作が必要な範囲に絞る\n- 認証と認可を分けて考える',
    category: 'TECH' as const,
    viewCount: 126,
    publishedAt: new Date('2026-08-27T09:00:00+09:00'),
    tagSlugs: ['nextjs', 'design', 'authentication'],
  },
  {
    id: 'seed-post-incident-checklist',
    authorId: 'seed-user-morikawa',
    title: '障害対応の初動を速くするために整えたチェックリスト',
    excerpt:
      '深夜対応で迷わないための確認項目と、情報を残すときに意識していることをまとめました。',
    content:
      '## 初動で確認すること\n\n1. 影響範囲を確認する\n2. 直近の変更を確認する\n3. 対応履歴を時系列で残す',
    category: 'TECH' as const,
    viewCount: 98,
    publishedAt: new Date('2026-08-25T11:00:00+09:00'),
    tagSlugs: ['sre', 'operation', 'incident-response'],
  },
  {
    id: 'seed-post-onboarding',
    authorId: 'seed-user-ono',
    title: '新入社員が最初の30日で知っておきたい社内の進め方',
    excerpt:
      '相談先の見つけ方、会議の準備、ドキュメント文化など、入社直後に役立つ知識です。',
    content:
      '## 最初に覚えること\n\n困った時は抱え込まず、関連するナレッジと担当メンバーを探しましょう。',
    category: 'BUSINESS' as const,
    viewCount: 142,
    publishedAt: new Date('2026-08-22T10:00:00+09:00'),
    tagSlugs: ['onboarding', 'work-skills'],
  },
  {
    id: 'seed-post-project-start',
    authorId: 'seed-user-takahashi',
    title: 'プロジェクト開始時に合意しておくと助かる5つのこと',
    excerpt: '役割、連絡手段、完了条件など、開始前に揃えたい項目を紹介します。',
    content:
      '## 合意しておく項目\n\n- 目的\n- 担当範囲\n- 連絡手段\n- 完了条件\n- 振り返り方法',
    category: 'BUSINESS' as const,
    viewCount: 53,
    publishedAt: new Date('2026-08-28T13:00:00+09:00'),
    tagSlugs: ['project-management', 'team'],
  },
  {
    id: 'seed-post-prisma-migration',
    authorId: 'seed-user-yamamoto',
    title: 'Prisma Migrationを本番環境へ安全に反映する流れ',
    excerpt: 'Migration作成から本番反映、status確認までの手順をまとめます。',
    content:
      '## 基本フロー\n\nMigrationを作成し、検証環境で確認してから prisma migrate deploy を実行します。',
    category: 'TECH' as const,
    viewCount: 76,
    publishedAt: new Date('2026-08-28T09:00:00+09:00'),
    tagSlugs: ['prisma', 'postgresql'],
  },
  {
    id: 'seed-post-customer-faq',
    authorId: 'seed-user-ito',
    title: 'お客様からよく聞かれる質問と、回答時のポイント',
    excerpt: '問い合わせ対応で共通して使える確認事項と回答例をまとめました。',
    content:
      '## 回答前に確認すること\n\n利用環境と発生手順を確認し、再現条件を揃えてから案内します。',
    category: 'BUSINESS' as const,
    viewCount: 41,
    publishedAt: new Date('2026-08-27T15:00:00+09:00'),
    tagSlugs: ['customer-support', 'faq'],
  },
] as const;

export const SEED_COMMENTS = [
  {
    id: 'seed-comment-1',
    postId: 'seed-post-nextjs-design',
    authorId: 'seed-user-yamamoto',
    content: 'ServerとClientの境界が分かりやすかったです。',
  },
  {
    id: 'seed-comment-2',
    postId: 'seed-post-nextjs-design',
    authorId: 'seed-user-morikawa',
    content: '認可をAPI側でも確認する点が参考になりました。',
  },
  {
    id: 'seed-comment-3',
    postId: 'seed-post-incident-checklist',
    authorId: 'seed-user-sato',
    content: 'チームのRunbookにも取り込みたいです。',
  },
  {
    id: 'seed-comment-4',
    postId: 'seed-post-onboarding',
    authorId: 'seed-user-takahashi',
    content: '新しいメンバーへの案内に使います。',
  },
] as const;

export const SEED_LIKES = [
  ['seed-user-morikawa', 'seed-post-nextjs-design'],
  ['seed-user-ono', 'seed-post-nextjs-design'],
  ['seed-user-yamamoto', 'seed-post-nextjs-design'],
  ['seed-user-sato', 'seed-post-incident-checklist'],
  ['seed-user-ito', 'seed-post-incident-checklist'],
  ['seed-user-sato', 'seed-post-onboarding'],
  ['seed-user-morikawa', 'seed-post-onboarding'],
  ['seed-user-takahashi', 'seed-post-onboarding'],
  ['seed-user-ono', 'seed-post-project-start'],
  ['seed-user-sato', 'seed-post-prisma-migration'],
  ['seed-user-ito', 'seed-post-customer-faq'],
] as const;
