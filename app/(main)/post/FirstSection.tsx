'use client';

import {
  fetchPostCreate,
  type PostData,
} from '@/app/api/post/fetch';
import { fetchUpdatePost } from '@/app/api/post/[postId]/fetch';
import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCheck,
  FiEdit3,
  FiLoader,
  FiSave,
  FiSend,
} from 'react-icons/fi';
import { useEffect, useRef, useState } from 'react';

type FirstSectionProps = {
  mode: 'create' | 'edit';
  postId?: string;
  storageKey: string;
};

type DraftChangeDetail = {
  storageKey: string;
  data: PostData;
};

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const FirstSection = ({ mode, postId, storageKey }: FirstSectionProps) => {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const currentPostIdRef = useRef(postId);
  const isSavingRef = useRef(false);
  const autoSaveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    currentPostIdRef.current = postId;
  }, [postId]);

  useEffect(() => {
    const handleDraftChange = (event: Event) => {
      const { detail } = event as CustomEvent<DraftChangeDetail>;
      if (detail.storageKey !== storageKey) return;

      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }

      const hasInput = Boolean(
        detail.data.title?.trim() ||
          detail.data.excerpt?.trim() ||
          detail.data.content?.trim() ||
          detail.data.tags.length,
      );
      if (!hasInput) return;

      // 最後の入力から1.5秒待ち、連続入力中のAPIリクエストをまとめる。
      autoSaveTimerRef.current = window.setTimeout(async () => {
        if (isSavingRef.current) return;

        try {
          isSavingRef.current = true;
          setSaveStatus('saving');
          setNotice('');

          const targetPostId = currentPostIdRef.current;
          if (targetPostId) {
            await fetchUpdatePost(targetPostId, detail.data, {
              publish: false,
            });
          } else {
            const response = await fetchPostCreate(detail.data, {
              publish: false,
            });
            currentPostIdRef.current = response.postId;

            // 新規記事を一度だけ作成し、以降の自動保存はPATCHへ切り替える。
            localStorage.removeItem(storageKey);
            router.replace(`/post/${response.postId}/edit`);
          }

          setSaveStatus('saved');
        } catch (error) {
          console.error('記事の自動保存に失敗しました:', error);
          setSaveStatus('error');
          setNotice('保存できませんでした。下書き保存をお試しください。');
        } finally {
          isSavingRef.current = false;
        }
      }, 1500);
    };

    window.addEventListener('post-editor:draft-change', handleDraftChange);
    return () => {
      window.removeEventListener('post-editor:draft-change', handleDraftChange);
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [router, storageKey]);

  const savePost = async (publish: boolean) => {
    if (isSavingRef.current) return;

    try {
      if (autoSaveTimerRef.current) {
        window.clearTimeout(autoSaveTimerRef.current);
      }
      isSavingRef.current = true;
      setIsSaving(true);
      setSaveStatus('saving');
      setNotice('');
      const localData = localStorage.getItem(storageKey);
      const cashData = localData ? JSON.parse(localData) : null;
      if (!cashData) throw new Error('記事の入力値を取得できませんでした。');

      let response: { message: string; postId: string };

      const targetPostId = currentPostIdRef.current;
      if (targetPostId) {
        response = await fetchUpdatePost(targetPostId, cashData, { publish });
      } else {
        response = await fetchPostCreate(cashData, { publish });
        currentPostIdRef.current = response.postId;
      }

      localStorage.removeItem(storageKey);
      setNotice(response.message);
      setSaveStatus('saved');
      router.push('/post/' + response.postId);
      router.refresh();
    } catch (error) {
      console.error(error);
      setNotice(
        error instanceof Error ? error.message : '記事を保存できませんでした。',
      );
      setSaveStatus('error');
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  };
  return (
    <motion.header
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
    >
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

      <div className="flex flex-col gap-2 sm:items-end">
        <div className="flex items-center gap-3 sm:justify-end">
          <button
            type="button"
            onClick={() => savePost(false)}
            disabled={isSaving}
            className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#D8E0E9] bg-white px-5 text-sm font-bold text-[#566477] transition hover:border-[#B97845]/35 hover:bg-[#FCF7F2] sm:flex-none"
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

        {/* 高さを常に確保し、保存状態が変わってもヘッダーを動かさない。 */}
        <div
          aria-live="polite"
          className="flex h-5 items-center justify-end gap-1.5 text-xs font-semibold"
        >
          {saveStatus === 'saving' && (
            <span className="inline-flex items-center gap-1.5 text-[#7B8899]">
              <FiLoader aria-hidden="true" className="animate-spin" />
              保存中
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="inline-flex items-center gap-1.5 text-[#39745A]">
              <FiCheck aria-hidden="true" />
              保存済み
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="inline-flex items-center gap-1.5 text-[#A34F55]">
              <FiAlertCircle aria-hidden="true" />
              {notice}
            </span>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default FirstSection;
