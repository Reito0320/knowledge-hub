'use client';

import { useCallback, useEffect, useMemo, useReducer, useRef, type SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { fetchPostCreate, type PostData } from '@/lib/api/post/fetch';
import { fetchUpdatePost } from '@/lib/api/post/[postId]/fetch';
import { validatePostForPublish } from '@/lib/post/validate-post-for-publish';
import { createEditorState, editorReducer } from './editor-reducer';

export function useEditorController(postId?: string, initialData?: PostData) {
  const [state, dispatch] = useReducer(editorReducer, initialData, createEditorState);
  const router = useRouter();
  const currentPostId = useRef(postId);
  const saving = useRef(false);
  const mounted = useRef(false);
  const latestRevision = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; clearTimeout(timer.current); };
  }, []);
  useEffect(() => { latestRevision.current = state.revision; }, [state.revision]);

  const fields = useMemo(() => {
    const field = <K extends keyof PostData>(key: K) => (value: SetStateAction<PostData[K]>) => {
      dispatch({ type: 'change', update: (draft) => ({
        ...draft, [key]: typeof value === 'function' ? value(draft[key]) : value,
      }) });
    };
    return {
      setTitle: field('title'), setExcerpt: field('excerpt'), setContent: field('content'),
      setCategory: field('category'), setVisibility: field('visibility'), setSelectedTagList: field('tags'),
    };
  }, []);

  const save = useCallback(async (publish: boolean, manual: boolean) => {
    if (saving.current) return;
    clearTimeout(timer.current);
    const { draft, revision } = state;
    if (publish) {
      const invalid = validatePostForPublish(draft).filter((item) => !item.valid);
      if (invalid.length) {
        dispatch({ type: 'failed', message: invalid.map((item) => item.message).join(' ') });
        document.getElementById('publish-check')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }
    saving.current = true;
    dispatch({ type: 'saving', manual });
    try {
      const existingId = currentPostId.current;
      const response = existingId
        ? await fetchUpdatePost(existingId, draft, { publish })
        : await fetchPostCreate(draft, { publish });
      currentPostId.current = response.postId;
      if (!mounted.current) return;
      dispatch({ type: 'saved', revision, message: response.message });
      // Save the current snapshot first; edits made during the request remain dirty.
      if (manual && latestRevision.current === revision) {
        toast.success(response.message);
        router.push(`/post/${response.postId}`);
        router.refresh();
      } else if (!existingId) {
        window.history.replaceState(null, '', `/post/${response.postId}/edit`);
      }
    } catch (error) {
      if (!mounted.current) return;
      const message = error instanceof Error ? error.message : '記事を保存できませんでした。';
      dispatch({ type: 'failed', message });
      if (manual) toast.error(message);
    } finally {
      saving.current = false;
    }
  }, [router, state]);

  useEffect(() => {
    if (state.revision === state.savedRevision || state.saveStatus === 'saving' || state.saveStatus === 'error') return;
    const { draft } = state;
    if (!draft.title.trim() && !draft.excerpt.trim() && !draft.content.trim() && !draft.tags.length) return;
    timer.current = setTimeout(() => void save(false, false), 1500);
    return () => clearTimeout(timer.current);
  }, [save, state]);

  return { ...state, ...fields, savePost: (publish: boolean) => save(publish, true) };
}
