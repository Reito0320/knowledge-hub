const SearchLoading = () => (
  <main className="min-h-[calc(100vh-4rem)] bg-[#F7F6F3] px-4 py-10 sm:px-6">
    <div className="mx-auto max-w-6xl animate-pulse">
      <div className="h-4 w-32 rounded bg-[#E6DCD2]" />
      <div className="mt-3 h-8 w-72 rounded bg-[#EAE1D9]" />
      <div className="mt-7 h-11 max-w-2xl rounded-xl bg-[#EEE6DE]" />
      <div className="mt-8 space-y-5">
        {[0, 1, 2].map((item) => <div key={item} className="h-44 rounded-2xl border border-[#E6DDD4] bg-white" />)}
      </div>
    </div>
  </main>
);

export default SearchLoading;
