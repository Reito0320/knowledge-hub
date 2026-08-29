import Link from 'next/link';
import { FiArrowUpRight, FiMessageCircle, FiHeart } from 'react-icons/fi';

export type ActivityArticle = {
  postId: string;
  title: string;
  excerpt: string | null;
  occurredAt: Date;
  note?: string;
};

type Props = {
  title: string;
  description: string;
  type: 'comment' | 'like';
  articles: ActivityArticle[];
};

const ActivityArticleList = ({ title, description, type, articles }: Props) => {
  const Icon = type === 'comment' ? FiMessageCircle : FiHeart;
  return (
    <section className="rounded-2xl border border-[#E6DDD4] bg-white p-5 shadow-[0_10px_30px_rgba(92,67,47,0.05)] sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF0E2] text-[#A66334]"><Icon aria-hidden="true" /></span>
        <div>
          <h2 className="font-bold text-[#4C433C]">{title}</h2>
          <p className="mt-1 text-xs text-[#887B70]">{description}</p>
        </div>
      </div>
      {articles.length ? (
        <ul className="mt-5 divide-y divide-[#F0E9E2]">
          {articles.map((article) => (
            <li key={`${type}-${article.postId}`}>
              <Link href={`/post/${article.postId}`} className="group flex items-start justify-between gap-4 py-4">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[#4C5159] group-hover:text-[#A66334]">{article.title}</h3>
                  <p className="mt-1 line-clamp-1 text-xs text-[#887B70]">{article.note ?? article.excerpt ?? '概要はありません'}</p>
                  <time className="mt-2 block text-[11px] text-[#A0958C]">{article.occurredAt.toLocaleDateString('ja-JP')}</time>
                </div>
                <FiArrowUpRight aria-hidden="true" className="mt-1 shrink-0 text-[#A66334]" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 rounded-xl bg-[#FCF8F4] px-4 py-8 text-center text-sm text-[#887B70]">まだ履歴はありません。</p>
      )}
    </section>
  );
};

export default ActivityArticleList;
