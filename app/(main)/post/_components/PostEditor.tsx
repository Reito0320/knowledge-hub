'use client';

import FirstSection from '../FirstSection';
import SecondSection, {
  type PostEditorInitialData,
} from '../SecondSection';

type PostEditorProps = {
  mode: 'create' | 'edit';
  postId?: string;
  initialData?: PostEditorInitialData;
};

// 新規作成と編集で共通利用する投稿フォーム。
const PostEditor = ({ mode, postId, initialData }: PostEditorProps) => {
  const storageKey = mode === 'create' ? 'post-draft:new' : `post-draft:${postId}`;

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <form className="mx-auto max-w-345">
        <FirstSection
          mode={mode}
          postId={postId}
          storageKey={storageKey}
        />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <SecondSection
            storageKey={storageKey}
            initialData={initialData}
          />
        </div>
      </form>
    </main>
  );
};

export default PostEditor;
