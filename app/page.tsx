import FirstSection from './_comp/FirstSection';
import SecondSection from './_comp/SecondSection';
import { getCurrentUser } from '@/lib/auth/get-current-user';
import ThirdSection from './_comp/ThirdSection';

export default async function Home() {
  return (
    <main className="min-h-screen bg-[#F5F7FA] text-[#1E2A3A]">
      <FirstSection />
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 lg:py-14">
        <SecondSection />
        <ThirdSection />
      </div>
    </main>
  );
}
