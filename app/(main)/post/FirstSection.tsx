'use client';

import { fetchPostCreate } from '@/app/api/post/fetch';
import { fetchUpdatePost } from '@/app/api/post/[postId]/fetch';
import { useRouter } from 'next/navigation';
import { FiArrowLeft, FiEdit3, FiSave, FiSend } from 'react-icons/fi';
import { useState } from 'react';

type FirstSectionProps = {
  mode: 'create' | 'edit';
  postId?: string;
  storageKey: string;
};

const FirstSection = ({ mode, postId, storageKey }: FirstSectionProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string>('');

  const savePost = async (publish: boolean) => {
    if (isSaving) return;

    try {
      setIsSaving(true);
      setNotice('');
      const localData = localStorage.getItem(storageKey);
      const cashData = localData ? JSON.parse(localData) : null;
      if (!cashData) throw new Error('記事の入力値を取得できませんでした。');

      let response: { message: string; postId: string };

      if (mode === 'edit' && postId) {
        response = await fetchUpdatePost(postId, cashData, { publish });
      } else {
        response = await fetchPostCreate(cashData, { publish });
      }

      localStorage.removeItem(storageKey);
      setNotice(response.message);
      router.push('/post/' + response.postId);
      router.refresh();
    } catch (error) {
      console.error(error);
      setNotice(
        error instanceof Error ? error.message : '記事を保存できませんでした。',
      );
    } finally {
      setIsSaving(false);
    }
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
        <button
          type="button"
          onClick={() => savePost(false)}
          disabled={isSaving}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D8E0E9] bg-white px-5 text-sm font-bold text-[#566477] transition hover:border-[#254F8F]/30 hover:bg-[#F8FAFC] sm:flex-none"
        >
          <FiSave aria-hidden="true" />
          {isSaving ? '保存中...' : '下書き保存'}
        </button>
        <button
          type="button"
          onClick={() => savePost(true)}
          disabled={isSaving}
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#254F8F] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1E3A5F] sm:flex-none"
        >
          <FiSend aria-hidden="true" />
          {isSaving ? '処理中...' : '公開する'}
        </button>
      </div>
      {notice && (
        <p className="text-sm font-semibold text-[#66758A] lg:basis-full lg:text-right">
          {notice}
        </p>
      )}
    </header>
  );
};

export default FirstSection;
