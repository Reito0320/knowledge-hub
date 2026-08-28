'use client';

import { fetchPostCreate } from '@/app/api/post/fetch';
import { fetchUpdatePost } from '@/app/api/post/[postId]/fetch';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiEdit3, FiSave, FiSend } from 'react-icons/fi';

type FirstSectionProps = {
  mode: 'create' | 'edit';
  postId?: string;
  storageKey: string;
};

const FirstSection = ({ mode, postId, storageKey }: FirstSectionProps) => {
  const router = useRouter();
  const handleSavebutton = async () => {
    const localData = localStorage.getItem(storageKey);
    const cashData = localData ? JSON.parse(localData) : null;
    if (!cashData) return;

    const message =
      mode === 'edit' && postId
        ? await fetchUpdatePost(postId, cashData)
        : await fetchPostCreate(cashData);

    console.log(message);
  };
  return (
    <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <span
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#66758A] transition hover:text-[#254F8F]"
        >
          <FiArrowLeft aria-hidden="true" />
          戻る
        </span>
        <div className="mt-4 flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-[#E8F0FA] text-[#254F8F]">
            <FiEdit3 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#1E3A5F] sm:text-3xl">
              {mode === 'edit' ? 'ナレッジを編集' : 'ナレッジを投稿'}
            </h1>
            <p className="mt-1 text-sm text-[#7B8899]">
              {mode === 'edit'
                ? '記事の内容を更新して、より役立つナレッジに育てましょう。'
                : 'あなたの経験を、チームみんなの知識に変えましょう。'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:justify-end">
        {/* TODO: 下書き保存APIを接続し、保存中・保存済みの状態を表示する */}
        <button
          type="button"
          onClick={handleSavebutton}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D8E0E9] bg-white px-5 text-sm font-bold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#F8FAFC] sm:flex-none"
        >
          <FiSave aria-hidden="true" />
          下書き保存
        </button>
        {/* TODO: 入力検証後に記事作成APIを呼び、作成した記事詳細へ遷移する */}
        <button
          type="button"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#254F8F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3A5F] sm:flex-none"
        >
          <FiSend aria-hidden="true" />
          公開する
        </button>
      </div>
    </header>
  );
};

export default FirstSection;
