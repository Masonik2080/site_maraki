// app/legal/loading.tsx
export default function LegalLoading() {
  return (
    <div className="layout-container py-10 min-h-[80vh] animate-pulse">
      <div className="max-w-3xl mx-auto">
        {/* Title */}
        <div className="h-8 w-64 bg-zinc-200 dark:bg-zinc-800 rounded mb-8" />
        
        {/* Content blocks */}
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="space-y-3">
              <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded" />
              <div className="h-4 w-full bg-zinc-100 dark:bg-zinc-800/50 rounded" />
              <div className="h-4 w-5/6 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
              <div className="h-4 w-4/5 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
