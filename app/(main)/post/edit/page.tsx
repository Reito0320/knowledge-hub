import FirstSection from '../FirstSection';
import SecondSection from '../SecondSection';

// 新規投稿と、既存記事の編集フォームを表示するページ。
// TODO: searchParamsのpostIdを受け取り、編集時は既存記事を初期値として渡す。
const PostEditPage = () => {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] px-4 py-7 sm:px-6 lg:px-8 lg:py-9">
      <form className="mx-auto max-w-345">
        {/* TODO: usePostEditorまたはform stateで入力値・下書き状態を管理する */}
        <FirstSection />

        <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <SecondSection />
        </div>
      </form>
    </main>
  );
};

export default PostEditPage;
