// app/learn/[courseSlug]/loading.tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`} />;
}

export default function CourseLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[--color-page-bg]">
      {/* Header skeleton */}
      <header className="h-16 border-b border-[--color-border-main] flex items-center px-6 lg:px-10 shrink-0">
        <Skeleton className="h-6 w-64" />
      </header>

      {/* Content skeleton */}
      <div className="flex-1 overflow-hidden">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-row items-start justify-center p-6 lg:p-10 gap-10">
            {/* Main content */}
            <div className="flex-1 min-w-0 max-w-[800px] space-y-6">
              <Skeleton className="h-8 w-3/4 mb-4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-64 w-full mt-6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>

            {/* TOC skeleton (desktop) */}
            <div className="hidden xl:block w-64 shrink-0">
              <Skeleton className="h-5 w-32 mb-4" />
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-4 w-full" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
