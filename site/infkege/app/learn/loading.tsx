// app/learn/loading.tsx
// Streaming loading skeleton for learn pages
export default function LearnLoading() {
  return (
    <div className="min-h-screen bg-[--color-page-bg] animate-pulse">
      {/* Top bar */}
      <div className="h-14 border-b border-border-main bg-white dark:bg-zinc-900 flex items-center px-4 gap-4">
        <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-5 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:block w-72 border-r border-border-main bg-white dark:bg-zinc-900 p-4 space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            </div>
          ))}
        </div>
        
        {/* Content */}
        <div className="flex-1 p-6 lg:p-10 max-w-4xl mx-auto">
          <div className="h-10 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded mb-6" />
          <div className="space-y-4">
            <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            <div className="h-4 w-4/5 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
          </div>
          <div className="mt-8 h-64 bg-zinc-100 dark:bg-zinc-800/50 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
