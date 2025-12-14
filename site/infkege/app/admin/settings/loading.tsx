// app/admin/settings/loading.tsx
export default function SettingsLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto animate-pulse">
      {/* Header */}
      <div className="mb-8">
        <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
        <div className="h-4 w-64 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
      </div>

      {/* Settings sections */}
      <div className="space-y-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white dark:bg-zinc-900 border border-border-main rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
              <div>
                <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-1" />
                <div className="h-3 w-48 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
              <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
