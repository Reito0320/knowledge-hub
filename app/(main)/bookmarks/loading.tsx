const BookmarksLoading = () => (
  <main className="min-h-[calc(100vh-4rem)] bg-[#F7F6F3] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="mx-auto max-w-5xl animate-pulse" role="status" aria-label="お気に入りを読み込み中">
      <div className="h-4 w-28 rounded bg-[#E6DCD2]" />
      <div className="mt-3 h-9 w-40 rounded bg-[#EAE1D9]" />
      <div className="mt-8 h-5 w-48 rounded bg-[#E6DCD2]" />
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {[0, 1].map((item) => <div key={item} className="h-32 rounded-2xl border border-[#E3DDD6] bg-white" />)}
      </div>
      <div className="mt-10 h-5 w-36 rounded bg-[#E6DCD2]" />
      <div className="mt-4 space-y-4">
        {[0, 1, 2].map((item) => <div key={item} className="h-36 rounded-2xl border border-[#E3DDD6] bg-white" />)}
      </div>
    </div>
  </main>
);

export default BookmarksLoading;
