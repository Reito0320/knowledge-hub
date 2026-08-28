const Skeleton = () => {
  return (
    <main className="min-h-[calc(100vh-4rem)] bg-[#F5F7FA] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl animate-pulse space-y-5">
        <div className="h-5 w-28 rounded bg-[#E3E8EE]" />
        <div className="rounded-2xl border border-[#E0E6ED] bg-white p-6 sm:p-10">
          <div className="h-6 w-28 rounded bg-[#E9EDF2]" />
          <div className="mt-5 h-10 w-4/5 rounded bg-[#E3E8EE]" />
          <div className="mt-4 h-5 w-3/5 rounded bg-[#EEF1F4]" />
          <div className="mt-10 h-80 rounded-xl bg-[#F1F3F6]" />
        </div>
      </div>
    </main>
  );
};

export default Skeleton;
