type SearchParamsProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    member?: string;
  }>;
};

const SearchPage = async ({ searchParams }: SearchParamsProps) => {
  /* qは検索窓からのsearch */
  /* categoryはtagからのsearch */
  /* memberはheaderの検索窓からのsearch */
  /* 何もない場合は最新topicのLink Tagからの遷移 */
  const { q, category, member } = await searchParams;

  return <div>SearchPage</div>;
};

export default SearchPage;
