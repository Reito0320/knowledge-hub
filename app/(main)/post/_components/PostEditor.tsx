'use client';

import { PostEditorProvider } from '@/lib/post/editor/post-editor-context';
import FirstSection from '../FirstSection';
import SecondSection from '../SecondSection';
import type { PostData } from '@/lib/api/post/fetch';

type PostEditorProps = {
  mode: 'create' | 'edit';
  postId?: string;
  initialData?: PostData;
};

// 新規作成と編集で共通利用する投稿フォーム。
const PostEditor = ({ mode, postId, initialData }: PostEditorProps) => {
  return (
    <PostEditorProvider key={postId ?? 'new'} postId={postId} initialData={initialData}>
      <main className="min-h-[calc(100vh-4rem)] bg-[#F8F5F1] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
        <form className="mx-auto max-w-345">
          <FirstSection mode={mode} />

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <SecondSection />
          </div>
        </form>
      </main>
    </PostEditorProvider>
  );
};

export default PostEditor;
