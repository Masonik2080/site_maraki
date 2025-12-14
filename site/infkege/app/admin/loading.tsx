// app/admin/loading.tsx
// Streaming loading skeleton for admin pages
export default function AdminLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto animate-pulse">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="h-7 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
          <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
        </div>
        <div className="h-10 w-28 bg-action/20 rounded-lg" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-lg w-fit mb-6">
        <div className="h-8 w-24 bg-white dark:bg-zinc-700 rounded-md" />
        <div className="h-8 w-20 bg-transparent rounded-md" />
        <div className="h-8 w-16 bg-transparent rounded-md" />
      </div>

      {/* Table skeleton */}
      <div className="bg-white dark:bg-zinc-900 border border-border-main rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="border-b border-border-main bg-zinc-50 dark:bg-zinc-800/50 px-4 py-3 flex gap-4">
          <div className="w-4 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="flex-1 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="w-20 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="w-24 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
          <div className="w-16 h-4 bg-zinc-200 dark:bg-zinc-700 rounded" />
        </div>
        
        {/* Data rows */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-4 py-4 border-b border-border-main last:border-0 flex items-center gap-4">
            <div className="w-4 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-100 dark:bg-zinc-800 rounded w-3/4" />
              <div className="h-3 bg-zinc-100 dark:bg-zinc-800 rounded w-20" />
            </div>
            <div className="w-16 h-4 bg-zinc-100 dark:bg-zinc-800 rounded" />
            <div className="flex gap-1">
              <div className="w-10 h-5 bg-zinc-100 dark:bg-zinc-800 rounded" />
              <div className="w-12 h-5 bg-zinc-100 dark:bg-zinc-800 rounded" />
            </div>
            <div className="w-16 h-5 bg-zinc-100 dark:bg-zinc-800 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
