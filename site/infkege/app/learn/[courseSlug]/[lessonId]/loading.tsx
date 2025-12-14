// app/learn/[courseSlug]/[lessonId]/loading.tsx
function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`} />;
}

export default function LessonLoading() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[--color-page-bg]">
      {/* Header skeleton */}
      <header className="h-16 border-b border-[--color-border-main] flex items-center px-6 lg:px-10 shrink-0 bg-[--color-page-bg]/80 backdrop-blur-sm">
        <Skeleton className="h-6 w-72" />
      </header>

      {/* Content skeleton */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex flex-row items-start justify-center p-6 lg:p-10 gap-10">
            {/* Main content */}
            <div className="flex-1 min-w-0 max-w-[800px] space-y-6">
              {/* Text blocks */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>

              {/* Code block skeleton */}
              <Skeleton className="h-48 w-full rounded-lg" />

              {/* More text */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>

              {/* Image skeleton */}
              <Skeleton className="h-64 w-full rounded-lg" />

              {/* More text */}
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>

              {/* Navigation skeleton */}
              <div className="mt-16 pt-8 border-t border-border-main flex items-center justify-between">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-12 w-32" />
              </div>
            </div>

            {/* TOC skeleton (desktop) */}
            <div className="hidden xl:block w-64 shrink-0 sticky top-6">
              <Skeleton className="h-5 w-28 mb-4" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
