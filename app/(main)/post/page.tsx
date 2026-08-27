import Link from 'next/link';
import {
  FiArrowLeft,
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
  FiSave,
  FiSend,
  FiTag,
  FiType,
  FiX,
} from 'react-icons/fi';

const editorTools = [
  { label: '見出し', icon: FiType },
  { label: '太字', icon: FiBold },
  { label: '斜体', icon: FiItalic },
  { label: 'リスト', icon: FiList },
  { label: 'リンク', icon: FiLink },
  { label: '画像', icon: FiImage },
  { label: 'コード', icon: FiCode },
];

const PostPage = () => {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <form className="mx-auto max-w-345">
        {/* TODO: usePostEditorまたはform stateで入力値・下書き状態を管理する */}
        <header className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#66758A] transition hover:text-[#254F8F]"
            >
              <FiArrowLeft aria-hidden="true" />
              ホームへ戻る
            </Link>
            <div className="mt-4 flex items-center gap-3">
              <span className="flex size-11 items-center justify-center rounded-xl bg-[#E8F0FA] text-[#254F8F]">
                <FiEdit3 aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1E3A5F] sm:text-3xl">
                  ナレッジを投稿
                </h1>
                <p className="mt-1 text-sm text-[#7B8899]">
                  あなたの経験を、チームみんなの知識に変えましょう。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:justify-end">
            {/* TODO: 下書き保存APIを接続し、保存中・保存済みの状態を表示する */}
            <button
              type="button"
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

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
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
                  maxLength={100}
                  placeholder="記事の内容が伝わるタイトルを入力"
                  className="mt-2 h-13 w-full rounded-xl border border-[#DDE4EC] bg-[#FBFCFD] px-4 text-base font-semibold text-[#26384D] outline-none transition placeholder:font-normal placeholder:text-[#A2ADBA] focus:border-[#254F8F]/50 focus:bg-white focus:ring-3 focus:ring-[#254F8F]/8 sm:text-lg"
                />
                <p className="mt-2 text-right text-xs text-[#98A4B3]">
                  0 / 100
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
                  maxLength={160}
                  placeholder="一覧画面に表示する短い説明を入力してください"
                  className="mt-2 w-full resize-none rounded-xl border border-[#DDE4EC] bg-[#FBFCFD] px-4 py-3 text-sm leading-6 text-[#344256] outline-none transition placeholder:text-[#A2ADBA] focus:border-[#254F8F]/50 focus:bg-white focus:ring-3 focus:ring-[#254F8F]/8"
                />
                <p className="mt-1 text-right text-xs text-[#98A4B3]">
                  0 / 160
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-[#DDE4EC] bg-[#F8FAFC] px-4 sm:px-6">
              <div className="flex h-14 items-end gap-1">
                {/* TODO: editorMode stateを追加してMarkdown編集とプレビューを切り替える */}
                <button
                  type="button"
                  className="flex h-12 items-center gap-2 border-b-2 border-[#254F8F] px-3 text-sm font-bold text-[#254F8F]"
                >
                  <FiEdit3 aria-hidden="true" />
                  編集
                </button>
                <button
                  type="button"
                  className="flex h-12 items-center gap-2 border-b-2 border-transparent px-3 text-sm font-semibold text-[#7B8899] transition hover:text-[#254F8F]"
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

            <div className="flex flex-wrap items-center gap-1 border-b border-[#E8EDF2] px-4 py-2.5 sm:px-6">
              {editorTools.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  title={label}
                  aria-label={label}
                  className="flex size-9 items-center justify-center rounded-lg text-[#66758A] transition hover:bg-[#E8F0FA] hover:text-[#254F8F]"
                >
                  <Icon aria-hidden="true" />
                </button>
              ))}
              <span className="ml-auto hidden rounded-md bg-[#EEF2F6] px-2 py-1 font-mono text-[10px] font-semibold text-[#788698] sm:inline">
                Markdown
              </span>
            </div>

            <div className="relative">
              <label htmlFor="post-content" className="sr-only">
                記事本文
              </label>
              <textarea
                id="post-content"
                name="content"
                spellCheck="false"
                placeholder={`## 見出し\n\n共有したい知識や経験をMarkdownで書いてみましょう。\n\n- 背景や困っていたこと\n- 試したこと\n- 解決方法と学び`}
                className="min-h-130 w-full resize-y bg-white px-5 py-6 pb-16 font-mono text-sm leading-7 text-[#344256] outline-none placeholder:text-[#A7B1BE] sm:px-7 lg:min-h-147.5"
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-[#EEF1F4] bg-white/95 px-5 py-3 text-xs text-[#8A97A8] backdrop-blur sm:px-7">
                <span>Markdown記法に対応しています</span>
                <span>0文字</span>
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
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border-2 border-[#254F8F] bg-[#EEF4FB] p-4">
                  <input
                    type="radio"
                    name="category"
                    value="TECH"
                    defaultChecked
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
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#DDE4EC] bg-white p-4 transition hover:border-[#B8C4D2]">
                  <input
                    type="radio"
                    name="category"
                    value="BUSINESS"
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
                  placeholder="タグを入力してEnter"
                  className="h-11 w-full rounded-xl border border-[#DDE4EC] bg-[#FBFCFD] pl-9 pr-10 text-sm text-[#344256] outline-none transition placeholder:text-[#A2ADBA] focus:border-[#254F8F]/50 focus:bg-white focus:ring-3 focus:ring-[#254F8F]/8"
                />
                <FiChevronDown
                  aria-hidden="true"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A97A8]"
                />
              </div>
              {/* TODO: tag stateと候補検索APIを追加し、選択・削除できるようにする */}
              <div className="mt-3 flex flex-wrap gap-2">
                {['Next.js', '認証'].map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#E8F0FA] px-2.5 py-1.5 text-xs font-semibold text-[#254F8F]"
                  >
                    #{tag}
                    <button
                      type="button"
                      aria-label={`${tag}タグを削除`}
                      className="rounded text-[#6E87A7] hover:text-[#1E3A5F]"
                    >
                      <FiX aria-hidden="true" />
                    </button>
                  </span>
                ))}
              </div>
            </section>

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
        </div>
      </form>
    </main>
  );
};

export default PostPage;
