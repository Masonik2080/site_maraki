// app/shop/loading.tsx
// Streaming loading skeleton for shop page
export default function ShopLoading() {
  return (
    <div className="layout-container py-10 min-h-[80vh] animate-pulse">
      {/* Header skeleton */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex h-7 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-5" />
        <div className="h-10 w-80 bg-zinc-200 dark:bg-zinc-800 rounded-lg mx-auto mb-4" />
        <div className="h-6 w-96 bg-zinc-100 dark:bg-zinc-800/50 rounded mx-auto" />
      </div>

      {/* Section title */}
      <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-6" />

      {/* Course cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-border-main rounded-2xl overflow-hidden">
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-5 space-y-3">
              <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
              <div className="h-4 w-2/3 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-10 w-28 bg-action/20 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Free section */}
      <div className="h-7 w-44 bg-zinc-200 dark:bg-zinc-800 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-border-main rounded-2xl overflow-hidden">
            <div className="aspect-video bg-zinc-100 dark:bg-zinc-800" />
            <div className="p-5 space-y-3">
              <div className="h-6 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
