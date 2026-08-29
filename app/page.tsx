import FirstSection from './_comp/FirstSection';
import SecondSection from './_comp/SecondSection';
import ThirdSection from './_comp/ThirdSection';
import { getHomeData } from '@/lib/home/get-home-data';
import { connection } from 'next/server';

export default async function Home() {
  // Build時ではなくRequest時に最新のDBデータを取得する。
  await connection();
  const homeData = await getHomeData();

  return (
    <main className="min-h-screen bg-[#F7F6F3] text-[#1E2A3A]">
      <FirstSection stats={homeData.stats} />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <SecondSection
          popularArticles={homeData.popularPosts}
          trendingTags={homeData.trendingTags}
          categoryCounts={homeData.categoryCounts}
          featuredMembers={homeData.featuredMembers}
        />
        <ThirdSection latestArticles={homeData.latestPosts} />
      </div>
    </main>
  );
}
