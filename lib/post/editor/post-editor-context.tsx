'use client';

import { createContext, useContext, type ReactNode } from 'react';
import type { PostData } from '@/lib/api/post/fetch';
import { useEditorController } from './use-editor-controller';

const PostEditorContext = createContext<ReturnType<typeof useEditorController> | null>(null);

export function PostEditorProvider({ children, postId, initialData }: {
  children: ReactNode;
  postId?: string;
  initialData?: PostData;
}) {
  const editor = useEditorController(postId, initialData);
  return <PostEditorContext.Provider value={editor}>{children}</PostEditorContext.Provider>;
}

export function usePostEditor() {
  const editor = useContext(PostEditorContext);
  if (!editor) throw new Error('usePostEditor must be used within PostEditorProvider');
  return editor;
}
