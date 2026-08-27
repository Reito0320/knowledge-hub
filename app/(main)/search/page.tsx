type SearchParamValue = string | string[] | undefined;

type SearchPageProps = {
  searchParams: Promise<{
    q?: SearchParamValue;
    category?: SearchParamValue;
    member?: SearchParamValue;
    tag?: SearchParamValue;
  }>;
};

const getFirstSearchParam = (value: SearchParamValue) => {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
};

const SearchPage = async ({ searchParams }: SearchPageProps) => {
  /* qはHomeの検索窓からのキーワード */
  /* categoryはカテゴリ・タグからの絞り込み */
  /* memberはHeaderのメンバー検索窓からのキーワード */
  /* 何もない場合は最新記事の一覧を表示する想定 */
  const params = await searchParams;

  const keyword = getFirstSearchParam(params.q);
  const category = getFirstSearchParam(params.category);
  const member = getFirstSearchParam(params.member);
  const tag = getFirstSearchParam(params.tag);

  // TODO: keyword,category,member,tagを使ってPrismaの検索条件を組み立てる
  console.log({ keyword, category, member, tag });

  return <div>SearchPage</div>;
};

export default SearchPage;
