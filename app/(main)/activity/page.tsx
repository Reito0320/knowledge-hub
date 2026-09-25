import { fetchServerApi } from '@/lib/api/server';
import type { ActivityData } from '@/lib/contracts/pages';
import ActivityArticleList from './_components/ActivityArticleList';

const ActivityPage = async () => {
  const data = await fetchServerApi<ActivityData>('/activity');
  const { commentedArticles, likedArticles } = data;
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#FAF7F3] px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#A66334]">Your activity</p>
        <h1 className="mt-2 text-2xl font-bold text-[#454A52] sm:text-3xl">あなたのリアクション履歴</h1>
        <p className="mt-2 text-sm text-[#81766D]">過去にコメント・いいねした記事へ、ここから戻れます。</p>
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <ActivityArticleList title="コメントした記事" description="最新のコメント順" type="comment" articles={commentedArticles} />
          <ActivityArticleList title="いいねした記事" description="最近いいねした順" type="like" articles={likedArticles} />
        </div>
      </div>
    </main>
  );
};

export default ActivityPage;
