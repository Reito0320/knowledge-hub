type SearchParamsProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
  }>;
};

const SearchPage = async ({ searchParams }: SearchParamsProps) => {
  const { q, category } = await searchParams;
  console.log(category);

  return <div>SearchPage</div>;
};

export default SearchPage;
