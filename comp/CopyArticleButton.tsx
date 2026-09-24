'use client';

import { FiClipboard } from 'react-icons/fi';
import { toast } from 'react-toastify';

export default function CopyArticleButton({ title, excerpt, content }: {
  title: string;
  excerpt?: string | null;
  content: string;
}) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText([
        `# ${title.trim() || '無題の記事'}`,
        ...(excerpt?.trim() ? [excerpt] : []),
        content,
      ].join('\n\n'));
      toast.success('記事をコピーしました。', { toastId: 'copy-article-success' });
    } catch {
      toast.error('コピーできませんでした。ブラウザのコピー権限を確認してください。', {
        toastId: 'copy-article-error',
      });
    }
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={copy} title="タイトル・概要・本文をMarkdown形式でコピー"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#DED4CA] bg-white px-3.5 text-sm font-bold text-[#5F5852] hover:bg-[#FFF8F1] focus-visible:outline-2 focus-visible:outline-offset-2">
        <FiClipboard aria-hidden="true" />記事を一括コピー
      </button>
    </div>
  );
}
