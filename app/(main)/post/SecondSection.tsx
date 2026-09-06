'use client';

type TagSuggestion = {
  // Tag候補APIから受け取る既存Tagの値。
  id: string;
  name: string;
  slug: string;
};

// 既存タグと、入力欄から新しく追加したタグをtypeで判別する。
export type SelectedTag =
  | {
      type: 'existing';
      id: string;
      name: string;
      slug: string;
    }
  | {
      type: 'new';
      name: string;
    };

import MarkdownRenderer from '@/comp/MarkdownRender';
import { getTagColorClass } from '@/lib/tag/get-tag-color-class';
import { continueMarkdownList } from '@/lib/markdown/continue-list';
import { uploadPostImage } from '@/app/api/post/images/fetch';
import type { PostVisibility } from '@/lib/post/post-visibility';
import { validatePostForPublish } from '@/lib/post/validate-post-for-publish';
import VisibilitySelector from './_components/VisibilitySelector';
import TextColorPicker, { type MarkdownTextColor } from './_components/TextColorPicker';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import {
  FiBold,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiCode,
  FiEdit3,
  FiEye,
  FiHash,
  FiImage,
  FiAlertCircle,
  FiItalic,
  FiLink,
  FiList,
  FiPlus,
  FiTag,
  FiType,
  FiX,
} from 'react-icons/fi';

// 前後の空白・全角半角・大文字小文字の違いを吸収して比較しやすくする。
// 例: 「 ＮＥＸＴ.js 」と「next.js」を同じ文字列として扱える。
const normalizeTagName = (name: string) =>
  name.trim().normalize('NFKC').toLocaleLowerCase();

export type PostEditorInitialData = {
  title: string;
  excerpt: string;
  content: string;
  category: 'TECH' | 'BUSINESS';
  visibility: PostVisibility;
  tags: SelectedTag[];
};

type SecondSectionProps = {
  storageKey: string;
  initialData?: PostEditorInitialData;
};

type EditorMode = 'edit' | 'preview';
type MarkdownTool =
  | 'heading'
  | 'bold'
  | 'italic'
  | 'list'
  | 'link'
  | 'image'
  | 'code';

const SecondSection = ({ storageKey, initialData }: SecondSectionProps) => {
  const [title, setTitle] = useState<string>(initialData?.title ?? '');
  const [excerpt, setExcerpt] = useState<string>(initialData?.excerpt ?? '');
  const [content, setContent] = useState<string>(initialData?.content ?? '');
  const [category, setCategory] = useState<'TECH' | 'BUSINESS'>(
    initialData?.category ?? 'TECH',
  );
  const [visibility, setVisibility] = useState<PostVisibility>(
    initialData?.visibility ?? 'ORGANIZATION',
  );
  const [tagName, setTagName] = useState<string>('');
  const [tagSuggestList, setTagSuggestList] = useState<TagSuggestion[]>([]);
  const [selectedTagList, setSelectedTagList] = useState<SelectedTag[]>(
    initialData?.tags ?? [],
  );
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const imageSelectionRef = useRef({ start: 0, end: 0, alt: '' });
  const lastDispatchedDraftRef = useRef(
    JSON.stringify({
      title: initialData?.title ?? '',
      excerpt: initialData?.excerpt ?? '',
      content: initialData?.content ?? '',
      category: initialData?.category ?? 'TECH',
      visibility: initialData?.visibility ?? 'ORGANIZATION',
      tags: initialData?.tags ?? [],
    }),
  );

  // 現在の入力値も正規化し、仮タグ一覧との部分一致検索に使用する。
  const normalizedTagName = normalizeTagName(tagName);
  const publishValidationItems = validatePostForPublish({ title, content });
  const invalidPublishItemCount = publishValidationItems.filter(
    (item) => !item.valid,
  ).length;

  useEffect(() => {
    if (!normalizedTagName) return;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        const response = await fetch(
          '/api/tags/suggestions?q=' + encodeURIComponent(tagName.trim()),
          { signal: abortController.signal },
        );
        if (!response.ok) throw new Error('タグ候補を取得できません。');

        const data: { tags: TagSuggestion[] } = await response.json();
        setTagSuggestList(
          data.tags.filter(
            (tag) =>
              !selectedTagList.some(
                (selectedTag) =>
                  normalizeTagName(selectedTag.name) ===
                  normalizeTagName(tag.name),
              ),
          ),
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        console.error(error);
        setTagSuggestList([]);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      abortController.abort();
    };
  }, [normalizedTagName, selectedTagList, tagName]);

  const handleSelectTag = (tag: TagSuggestion) => {
    // サジェストから選んだタグが、選択済み一覧に存在するか確認する。
    const duplicated = selectedTagList.some(
      (selectedTag) =>
        normalizeTagName(selectedTag.name) === normalizeTagName(tag.name),
    );

    // 重複している場合、または上限の5件に達している場合は追加しない。
    if (duplicated || selectedTagList.length >= 5) return;

    // DBに存在するタグなので、IDを保持したexistingとして追加する。
    setSelectedTagList((prev) => [
      ...prev,
      {
        type: 'existing',
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
      },
    ]);

    // 選択後に入力欄を空にすると、サジェストも自動的に閉じる。
    setTagName('');
    setTagSuggestList([]);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Enter以外のキーではタグ追加処理を実行しない。
    if (e.key !== 'Enter') return;

    // 親のformがEnterで送信されるのを防ぐ。
    e.preventDefault();

    const trimTagName = tagName.trim();

    // 空文字と、上限到達後のタグ追加を防ぐ。
    if (!trimTagName || selectedTagList.length >= 5) return;

    // 入力値と完全一致するサジェストがあれば、新規ではなく既存タグとして扱う。
    const existingTag = tagSuggestList.find(
      (tag) => normalizeTagName(tag.name) === normalizeTagName(trimTagName),
    );

    // 完全一致した既存タグは、サジェストをクリックした場合と同じ処理へ渡す。
    if (existingTag) return handleSelectTag(existingTag);

    // 新規タグも、選択済みタグと名前が重複していないか確認する。
    const duplicated = selectedTagList.some(
      (tag) => normalizeTagName(tag.name) === normalizeTagName(trimTagName),
    );

    if (duplicated) return;

    // 仮タグ一覧に存在しない入力値は、typeをnewとして選択済み一覧へ追加する。
    setSelectedTagList((prev) => [
      ...prev,
      {
        type: 'new',
        name: trimTagName,
      },
    ]);

    // 追加後は入力欄を空にする。
    setTagName('');
  };

  const editorTools: {
    label: string;
    icon: typeof FiType;
    tool: MarkdownTool;
  }[] = [
    { label: '見出し', icon: FiType, tool: 'heading' },
    { label: '太字', icon: FiBold, tool: 'bold' },
    { label: '斜体', icon: FiItalic, tool: 'italic' },
    { label: 'リスト', icon: FiList, tool: 'list' },
    { label: 'リンク', icon: FiLink, tool: 'link' },
    { label: '画像', icon: FiImage, tool: 'image' },
    { label: 'コード', icon: FiCode, tool: 'code' },
  ];

  const applyMarkdown = (tool: MarkdownTool) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;

    const selectionStart = textarea.selectionStart;
    const selectionEnd = textarea.selectionEnd;
    const selectedText = content.slice(selectionStart, selectionEnd);

    let replacement = '';
    let nextSelectionStart = 0;
    let nextSelectionEnd = 0;

    // 選択中の文字があれば装飾し、なければ編集しやすい仮文字を挿入する。
    switch (tool) {
      case 'heading': {
        const text = selectedText || '見出し';
        replacement = text
          .split('\n')
          .map((line) => `## ${line}`)
          .join('\n');
        nextSelectionStart = selectedText ? 0 : 3;
        nextSelectionEnd = selectedText ? replacement.length : 3 + text.length;
        break;
      }
      case 'bold': {
        const text = selectedText || '太字';
        replacement = `**${text}**`;
        nextSelectionStart = 2;
        nextSelectionEnd = 2 + text.length;
        break;
      }
      case 'italic': {
        const text = selectedText || '斜体';
        replacement = `*${text}*`;
        nextSelectionStart = 1;
        nextSelectionEnd = 1 + text.length;
        break;
      }
      case 'list': {
        const text = selectedText || 'リスト項目';
        replacement = text
          .split('\n')
          .map((line) => `- ${line}`)
          .join('\n');
        nextSelectionStart = selectedText ? 0 : 2;
        nextSelectionEnd = selectedText ? replacement.length : 2 + text.length;
        break;
      }
      case 'link': {
        const text = selectedText || 'リンクテキスト';
        replacement = `[${text}](https://example.com)`;
        nextSelectionStart = 1;
        nextSelectionEnd = 1 + text.length;
        break;
      }
      case 'image':
        return;
      case 'code': {
        const text = selectedText || 'コード';
        const isBlockCode = selectedText.includes('\n');
        replacement = isBlockCode ? `\`\`\`\n${text}\n\`\`\`` : `\`${text}\``;
        nextSelectionStart = isBlockCode ? 4 : 1;
        nextSelectionEnd = nextSelectionStart + text.length;
        break;
      }
    }

    const nextContent =
      content.slice(0, selectionStart) +
      replacement +
      content.slice(selectionEnd);
    setContent(nextContent);

    // Reactの再描画後に、挿入した文字を選択した状態へ戻す。
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        selectionStart + nextSelectionStart,
        selectionStart + nextSelectionEnd,
      );
    });
  };

  const selectPostImage = () => {
    const textarea = contentTextareaRef.current;
    if (!textarea || isUploadingImage) return;

    imageSelectionRef.current = {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      alt: content.slice(textarea.selectionStart, textarea.selectionEnd),
    };
    imageFileInputRef.current?.click();
  };

  const handlePostImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const markdownUrl = await uploadPostImage(file);
      const { start, end, alt: selectedAlt } = imageSelectionRef.current;
      const fallbackAlt = file.name.replace(/\.[^.]+$/, '') || '記事画像';
      const alt = (selectedAlt || fallbackAlt)
        .replace(/[\[\]\r\n]/g, ' ')
        .trim();
      const markdown = `![${alt}](${markdownUrl})`;

      setContent((current) =>
        current.slice(0, start) + markdown + current.slice(end),
      );

      window.requestAnimationFrame(() => {
        const textarea = contentTextareaRef.current;
        if (!textarea) return;
        const cursor = start + markdown.length;
        textarea.focus();
        textarea.setSelectionRange(cursor, cursor);
      });
    } catch (error) {
      console.error('記事画像のアップロードに失敗しました:', error);
      window.alert(
        error instanceof Error
          ? error.message
          : '記事画像をアップロードできませんでした。',
      );
    } finally {
      setIsUploadingImage(false);
    }
  };

  const applyTextColor = (color: MarkdownTextColor) => {
    const textarea = contentTextareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content.slice(start, end) || '色を付ける文字';
    const openingTag = `<span data-color="${color}">`;
    const replacement = `${openingTag}${text}</span>`;
    setContent(content.slice(0, start) + replacement + content.slice(end));
    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + openingTag.length, start + openingTag.length + text.length);
    });
  };

  useEffect(() => {
    const cashData = JSON.stringify({
      title,
      excerpt,
      content,
      category,
      visibility,
      tags: selectedTagList,
    });
    localStorage.setItem(storageKey, cashData);

    // 初期表示では通信せず、実際に入力内容が変わった時だけ自動保存を依頼する。
    if (cashData === lastDispatchedDraftRef.current) return;
    lastDispatchedDraftRef.current = cashData;
    window.dispatchEvent(
      new CustomEvent('post-editor:draft-change', {
        detail: {
          storageKey,
          data: JSON.parse(cashData),
        },
      }),
    );
  }, [
    storageKey,
    title,
    excerpt,
    content,
    category,
    visibility,
    selectedTagList,
  ]);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="min-w-0 overflow-hidden rounded-2xl border border-[#E3D9CF] bg-white shadow-[0_12px_35px_rgba(92,67,47,0.05)]"
      >
        <div className="space-y-6 border-b border-[#E8EDF2] p-5 sm:p-7">
          <div>
            <label
              htmlFor="post-title"
              className="text-sm font-bold text-[#344256]"
            >
              タイトル<span className="ml-1 text-[#C15E67]">*</span>
            </label>
            <input
              id="post-title"
              name="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="記事の内容が伝わるタイトルを入力"
              className="mt-2 h-13 w-full rounded-xl border border-[#DED6CE] bg-[#FCFAF7] px-4 text-base font-semibold text-[#3F4650] outline-none transition placeholder:font-normal placeholder:text-[#A29A93] focus:border-[#B97845]/55 focus:bg-white focus:ring-3 focus:ring-[#B97845]/10 sm:text-lg"
            />
            <p className="mt-2 text-right text-xs text-[#98A4B3]">
              {title.length} / 100
            </p>
          </div>

          <div>
            <label
              htmlFor="post-excerpt"
              className="text-sm font-bold text-[#344256]"
            >
              記事の概要
              <span className="ml-2 text-xs font-normal text-[#8A97A8]">
                任意
              </span>
            </label>
            <textarea
              id="post-excerpt"
              name="excerpt"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              maxLength={160}
              placeholder="一覧画面に表示する短い説明を入力してください"
              className="mt-2 w-full resize-none rounded-xl border border-[#DED6CE] bg-[#FCFAF7] px-4 py-3 text-sm leading-6 text-[#4B5159] outline-none transition placeholder:text-[#A29A93] focus:border-[#B97845]/55 focus:bg-white focus:ring-3 focus:ring-[#B97845]/10"
            />
            <p className="mt-1 text-right text-xs text-[#98A4B3]">
              {excerpt.length} / 160
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-[#DDE4EC] bg-[#F8FAFC] px-4 sm:px-6">
          <div className="flex h-14 items-end gap-1">
            <button
              type="button"
              onClick={() => setEditorMode('edit')}
              aria-pressed={editorMode === 'edit'}
              className={`flex h-12 items-center gap-2 border-b-2 px-3 text-sm transition ${
                editorMode === 'edit'
                  ? 'border-[#B66A36] font-bold text-[#99582E]'
                  : 'border-transparent font-semibold text-[#7B746E] hover:text-[#99582E]'
              }`}
            >
              <FiEdit3 aria-hidden="true" />
              編集
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('preview')}
              aria-pressed={editorMode === 'preview'}
              className={`flex h-12 items-center gap-2 border-b-2 px-3 text-sm transition ${
                editorMode === 'preview'
                  ? 'border-[#B66A36] font-bold text-[#99582E]'
                  : 'border-transparent font-semibold text-[#7B746E] hover:text-[#99582E]'
              }`}
            >
              <FiEye aria-hidden="true" />
              プレビュー
            </button>
          </div>
        </div>

        {editorMode === 'edit' && (
          <div className="flex flex-wrap items-center gap-1 border-b border-[#E8EDF2] px-4 py-2.5 sm:px-6">
            <input
              ref={imageFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handlePostImageChange}
              className="sr-only"
            />
            {editorTools.map(({ label, icon: Icon, tool }) => (
              <motion.button
                key={label}
                type="button"
                title={label}
                aria-label={`${label}のMarkdownを挿入`}
                onClick={() =>
                  tool === 'image' ? selectPostImage() : applyMarkdown(tool)
                }
                disabled={tool === 'image' && isUploadingImage}
                whileTap={{ scale: 0.92 }}
                className="flex size-9 items-center justify-center rounded-lg text-[#716961] transition hover:bg-[#FFF0E2] hover:text-[#A66334] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A66334] disabled:cursor-wait disabled:opacity-50"
              >
                <Icon aria-hidden="true" />
              </motion.button>
            ))}
            <TextColorPicker onSelect={applyTextColor} />
            <span className="ml-auto hidden rounded-md bg-[#EEF2F6] px-2 py-1 font-mono text-[10px] font-semibold text-[#788698] sm:inline">
              Markdown
            </span>
          </div>
        )}

        <div className="relative">
          {editorMode === 'edit' ? (
            <>
              <label htmlFor="post-content" className="sr-only">
                記事本文
              </label>
              <textarea
                ref={contentTextareaRef}
                id="post-content"
                name="content"
                spellCheck="false"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(event) => {
                  // 日本語変換の確定EnterとShift+Enterは通常入力に任せる。
                  if (
                    event.key !== 'Enter' ||
                    event.shiftKey ||
                    event.nativeEvent.isComposing
                  )
                    return;
                  const textarea = event.currentTarget;
                  const result = continueMarkdownList(
                    textarea.value,
                    textarea.selectionStart,
                    textarea.selectionEnd,
                  );
                  if (!result) return;

                  event.preventDefault();
                  setContent(result.content);
                  window.requestAnimationFrame(() => {
                    textarea.focus();
                    textarea.setSelectionRange(result.cursor, result.cursor);
                  });
                }}
                placeholder={`## 見出し\n\n共有したい知識や経験をMarkdownで書いてみましょう。\n\n- 背景や困っていたこと\n- 試したこと\n- 解決方法と学び`}
                className="min-h-130 w-full resize-y bg-white px-5 py-6 pb-16 font-mono text-sm leading-7 text-[#344256] outline-none placeholder:text-[#A7B1BE] sm:px-7 lg:min-h-147.5"
              />
            </>
          ) : (
            <div className="min-h-130 bg-white px-5 py-6 pb-16 sm:px-7 lg:min-h-147.5">
              {content.trim() ? (
                <MarkdownRenderer content={content} />
              ) : (
                <div className="flex min-h-96 items-center justify-center rounded-xl border border-dashed border-[#DDE4EC] bg-[#FBFCFD] px-6 text-center text-sm text-[#8A97A8]">
                  本文を入力すると、ここにMarkdownのプレビューが表示されます。
                </div>
              )}
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#EEF1F4] bg-white/95 px-5 py-3 text-xs text-[#8A97A8] backdrop-blur sm:px-7">
            <span>Markdown記法に対応しています</span>
            <span>{content.length}文字</span>
          </div>
        </div>
      </motion.section>
      <motion.aside
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
        className="space-y-5 xl:sticky xl:top-22"
      >
        <VisibilitySelector value={visibility} onChange={setVisibility} />
        <section className="rounded-2xl border border-[#E3D9CF] bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#4B4E54]">
            <FiBookOpen aria-hidden="true" className="text-[#A66334]" />
            記事のカテゴリ
          </div>
          <p className="mt-1 text-xs leading-5 text-[#8A97A8]">
            内容に最も近いカテゴリを選択してください。
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 transition ${
                category === 'TECH'
                  ? 'border-2 border-[#254F8F] bg-[#EEF4FB]'
                  : 'border border-[#DDE4EC] bg-white hover:border-[#B8C4D2]'
              }`}
            >
              <input
                type="radio"
                name="category"
                value="TECH"
                onChange={() => setCategory('TECH')}
                checked={category === 'TECH'}
                className="mt-1 accent-[#254F8F]"
              />
              <span>
                <span className="block text-sm font-bold text-[#254F8F]">
                  技術ブログ
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#6E7F94]">
                  開発・設計・インフラなど
                </span>
              </span>
            </label>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl p-4 transition ${
                category === 'BUSINESS'
                  ? 'border-2 border-[#995D31] bg-[#FAF1E9]'
                  : 'border border-[#DDE4EC] bg-white hover:border-[#B8C4D2]'
              }`}
            >
              <input
                type="radio"
                name="category"
                value="BUSINESS"
                onChange={() => setCategory('BUSINESS')}
                checked={category === 'BUSINESS'}
                className="mt-1 accent-[#995D31]"
              />
              <span>
                <span className="block text-sm font-bold text-[#6A4A32]">
                  業務・カルチャー
                </span>
                <span className="mt-1 block text-xs leading-5 text-[#7B8899]">
                  仕事術・制度・社内ノウハウ
                </span>
              </span>
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-[#E3D9CF] bg-white p-5">
          <label
            htmlFor="post-tags"
            className="flex items-center gap-2 text-sm font-bold text-[#4B4E54]"
          >
            <FiTag aria-hidden="true" className="text-[#A66334]" />
            タグ
          </label>
          <p className="mt-1 text-xs leading-5 text-[#8A97A8]">
            検索されやすいキーワードを5個まで設定できます。
          </p>
          <div className="relative mt-4">
            <FiHash
              aria-hidden="true"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A97A8]"
            />
            <input
              id="post-tags"
              name="tags"
              type="text"
              onChange={(e) => {
                setTagName(e.target.value);
                setTagSuggestList([]);
              }}
              value={tagName}
              onKeyDown={(e) => handleTagKeyDown(e)}
              placeholder="タグを入力してEnter"
              className="h-11 w-full rounded-xl border border-[#DED6CE] bg-[#FCFAF7] pl-9 pr-10 text-sm text-[#4B5159] outline-none transition placeholder:text-[#A29A93] focus:border-[#B97845]/55 focus:bg-white focus:ring-3 focus:ring-[#B97845]/10"
            />
            <FiChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8A97A8]"
            />
            {/* 入力値がある間だけ、入力欄を基準にサジェストを直下へ重ねて表示する。 */}
            {tagName.trim() && (
              <div className="absolute left-0 top-full z-30 mt-2 w-full overflow-hidden rounded-xl border border-[#DDE4EC] bg-white shadow-[0_14px_35px_rgba(30,58,95,0.14)]">
                {/* 部分一致する既存タグがあれば候補一覧を表示し、なければ新規追加の案内を表示する。 */}
                {tagSuggestList.length > 0 ? (
                  <ul className="max-h-52 overflow-y-auto p-2">
                    {tagSuggestList.map((tag) => (
                      <li key={tag.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectTag(tag)}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#4B5159] transition hover:bg-[#FFF3E8] hover:text-[#99582E]"
                        >
                          <FiHash
                            aria-hidden="true"
                            className="shrink-0 text-[#8A97A8]"
                          />
                          <span className="truncate font-semibold">
                            {tag.name}
                          </span>
                          <span className="ml-auto shrink-0 text-[11px] text-[#9AA7B7]">
                            既存タグ
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="flex items-start gap-2 px-4 py-3 text-sm text-[#66758A]">
                    <FiPlus
                      aria-hidden="true"
                      className="mt-0.5 shrink-0 text-[#254F8F]"
                    />
                    <p>
                      「
                      <span className="font-semibold text-[#344256]">
                        {tagName.trim()}
                      </span>
                      」を
                      <span className="font-semibold text-[#254F8F]">
                        Enter
                      </span>
                      で新しいタグとして追加
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* TODO: tag stateと候補検索APIを追加し、選択・削除できるようにする */}
          <div className="mt-3 flex flex-wrap gap-2">
            <AnimatePresence initial={false}>
              {selectedTagList.map((tag) => (
                <motion.span
                  layout
                  initial={{ opacity: 0, scale: 0.9, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  key={tag.name}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${getTagColorClass(tag.name)}`}
                >
                  #{tag.name}
                  <button
                    type="button"
                    aria-label={`${tag.name}タグを削除`}
                    onClick={() =>
                      setSelectedTagList((prev) =>
                        prev.filter((prevTag) => prevTag.name !== tag.name),
                      )
                    }
                    className="rounded text-current opacity-60 transition hover:opacity-100"
                  >
                    <FiX aria-hidden="true" />
                  </button>
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </section>

        <section
          id="publish-check"
          aria-live="polite"
          className={`rounded-2xl border p-5 ${
            invalidPublishItemCount > 0
              ? 'border-[#E5C7C3] bg-[#FFF9F8]'
              : 'border-[#CFE1D6] bg-[#F8FCF9]'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${invalidPublishItemCount > 0 ? 'bg-[#F9E7E5] text-[#A34F55]' : 'bg-[#E5F3EB] text-[#39745A]'}`}>
              {invalidPublishItemCount > 0 ? <FiAlertCircle aria-hidden="true" /> : <FiCheck aria-hidden="true" />}
            </span>
            <div>
              <h2 className="text-sm font-bold text-[#4B4E54]">公開前の入力チェック</h2>
              <p className="mt-1 text-xs leading-5 text-[#82776E]">
                {invalidPublishItemCount > 0
                  ? `公開までにあと${invalidPublishItemCount}項目必要です。`
                  : '公開に必要な項目が入力されています。'}
              </p>
            </div>
          </div>
          <ul className="mt-4 space-y-2.5">
            {publishValidationItems.map((item) => (
              <li key={item.field} className={`flex items-center gap-2 text-xs font-semibold ${item.valid ? 'text-[#39745A]' : 'text-[#A34F55]'}`}>
                {item.valid ? <FiCheck aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
                {item.valid ? `${item.label}を入力済み` : item.message}
              </li>
            ))}
            <li className={`flex items-center gap-2 text-xs font-semibold ${selectedTagList.length > 0 ? 'text-[#39745A]' : 'text-[#92714F]'}`}>
              {selectedTagList.length > 0 ? <FiCheck aria-hidden="true" /> : <FiAlertCircle aria-hidden="true" />}
              {selectedTagList.length > 0 ? 'タグを設定済み' : 'タグを設定すると記事を見つけやすくなります（任意）'}
            </li>
          </ul>
        </section>
      </motion.aside>
    </>
  );
};

export default SecondSection;
