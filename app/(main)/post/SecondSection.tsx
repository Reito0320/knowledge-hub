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
import { useEffect, useRef, useState } from 'react';
import {
  FiBold,
  FiBookOpen,
  FiCheck,
  FiChevronDown,
  FiClock,
  FiCode,
  FiEdit3,
  FiEye,
  FiHash,
  FiImage,
  FiInfo,
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
  const [tagName, setTagName] = useState<string>('');
  const [tagSuggestList, setTagSuggestList] = useState<TagSuggestion[]>([]);
  const [selectedTagList, setSelectedTagList] = useState<SelectedTag[]>(
    initialData?.tags ?? [],
  );
  const [editorMode, setEditorMode] = useState<EditorMode>('edit');
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);

  // 現在の入力値も正規化し、仮タグ一覧との部分一致検索に使用する。
  const normalizedTagName = normalizeTagName(tagName);

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
      case 'image': {
        const text = selectedText || '画像の説明';
        replacement = `![${text}](https://example.com/image.png)`;
        nextSelectionStart = 2;
        nextSelectionEnd = 2 + text.length;
        break;
      }
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

  useEffect(() => {
    const cashData = JSON.stringify({
      title,
      excerpt,
      content,
      category,
      tags: selectedTagList,
    });
    localStorage.setItem(storageKey, cashData);
  }, [
    storageKey,
    title,
    excerpt,
    content,
    category,
    selectedTagList,
  ]);

  return (
    <>
      <section className="min-w-0 overflow-hidden rounded-2xl border border-[#DDE4EC] bg-white shadow-[0_12px_35px_rgba(30,58,95,0.05)]">
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
              className="mt-2 h-13 w-full rounded-xl border border-[#DDE4EC] bg-[#FBFCFD] px-4 text-base font-semibold text-[#26384D] outline-none transition placeholder:font-normal placeholder:text-[#A2ADBA] focus:border-[#254F8F]/50 focus:bg-white focus:ring-3 focus:ring-[#254F8F]/8 sm:text-lg"
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
              className="mt-2 w-full resize-none rounded-xl border border-[#DDE4EC] bg-[#FBFCFD] px-4 py-3 text-sm leading-6 text-[#344256] outline-none transition placeholder:text-[#A2ADBA] focus:border-[#254F8F]/50 focus:bg-white focus:ring-3 focus:ring-[#254F8F]/8"
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
                  ? 'border-[#254F8F] font-bold text-[#254F8F]'
                  : 'border-transparent font-semibold text-[#7B8899] hover:text-[#254F8F]'
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
                  ? 'border-[#254F8F] font-bold text-[#254F8F]'
                  : 'border-transparent font-semibold text-[#7B8899] hover:text-[#254F8F]'
              }`}
            >
              <FiEye aria-hidden="true" />
              プレビュー
            </button>
          </div>
          <span className="hidden items-center gap-1.5 text-xs text-[#8A97A8] sm:flex">
            <FiClock aria-hidden="true" />
            未保存
          </span>
        </div>

        {editorMode === 'edit' && (
          <div className="flex flex-wrap items-center gap-1 border-b border-[#E8EDF2] px-4 py-2.5 sm:px-6">
            {editorTools.map(({ label, icon: Icon, tool }) => (
              <button
                key={label}
                type="button"
                title={label}
                aria-label={`${label}のMarkdownを挿入`}
                onClick={() => applyMarkdown(tool)}
                className="flex size-9 items-center justify-center rounded-lg text-[#66758A] transition hover:bg-[#E8F0FA] hover:text-[#254F8F] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#254F8F]"
              >
                <Icon aria-hidden="true" />
              </button>
            ))}
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
      </section>
      <aside className="space-y-5 xl:sticky xl:top-22">
        <section className="rounded-2xl border border-[#DDE4EC] bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F]">
            <FiBookOpen aria-hidden="true" className="text-[#254F8F]" />
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

        <section className="rounded-2xl border border-[#DDE4EC] bg-white p-5">
          <label
            htmlFor="post-tags"
            className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F]"
          >
            <FiTag aria-hidden="true" className="text-[#254F8F]" />
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
              className="h-11 w-full rounded-xl border border-[#DDE4EC] bg-[#FBFCFD] pl-9 pr-10 text-sm text-[#344256] outline-none transition placeholder:text-[#A2ADBA] focus:border-[#254F8F]/50 focus:bg-white focus:ring-3 focus:ring-[#254F8F]/8"
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
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-[#344256] transition hover:bg-[#EEF4FB] hover:text-[#254F8F]"
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
            {selectedTagList.map((tag) => (
              <span
                key={tag.name}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0FA] px-2.5 py-1.5 text-xs font-semibold text-[#254F8F]"
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
                  className="rounded text-[#6E87A7] hover:text-[#1E3A5F]"
                >
                  <FiX aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </section>

        {/* 自動チェックbuttonを押して公開前の個人情報や機密情報を検索するようなAI APIを使いたい。 */}
        <section className="rounded-2xl border border-[#DDE4EC] bg-white p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-[#1E3A5F]">
            <FiCheck aria-hidden="true" className="text-[#39745A]" />
            公開前のチェック
          </div>
          <ul className="mt-4 space-y-3 text-xs leading-5 text-[#66758A]">
            {[
              '個人情報や機密情報が含まれていない',
              'タイトルから内容を想像できる',
              '適切なカテゴリとタグを設定した',
            ].map((item) => (
              <li key={item} className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#9AA7B7]" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <div className="flex gap-3 rounded-2xl border border-[#D8E5F2] bg-[#EEF5FC] p-4">
          <FiInfo
            aria-hidden="true"
            className="mt-0.5 shrink-0 text-[#254F8F]"
          />
          <p className="text-xs leading-5 text-[#5D7189]">
            完璧にまとめなくても大丈夫です。まずは下書きに保存して、少しずつ育てていきましょう。
          </p>
        </div>
      </aside>
    </>
  );
};

export default SecondSection;
