const HomeLoading = () => {
  return (
    <main className="min-h-screen animate-pulse bg-[#F7F6F3]">
      <section className="border-b border-[#E5DED5] bg-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:py-16">
          <div className="space-y-4">
            <div className="h-7 w-52 rounded-full bg-[#F1E6DB]" />
            <div className="h-10 w-full max-w-lg rounded-xl bg-[#E7EBF0]" />
            <div className="h-5 w-4/5 rounded-lg bg-[#EEEAE5]" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="h-28 rounded-2xl border border-[#E7E0D9] bg-[#FAF7F3]"
              />
            ))}
          </div>
          <div className="h-18 rounded-2xl bg-[#EEEAE5] lg:col-span-2" />
        </div>
      </section>
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="h-8 w-44 rounded-lg bg-[#E5E0DA]" />
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-44 rounded-2xl bg-white" />
          ))}
        </div>
        <div className="space-y-5">
          <div className="h-40 rounded-2xl bg-white" />
          <div className="h-48 rounded-2xl bg-[#E3E7EC]" />
        </div>
      </div>
    </main>
  );
};

export default HomeLoading;
