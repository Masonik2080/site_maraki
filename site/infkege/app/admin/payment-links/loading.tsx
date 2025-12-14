// app/admin/payment-links/loading.tsx
// Скелетон для страницы платёжных ссылок

export default function PaymentLinksLoading() {
  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 lg:mb-6">
        <div className="min-w-0">
          <div className="h-6 lg:h-7 w-48 bg-zinc-200 rounded animate-pulse" />
          <div className="h-4 w-64 bg-zinc-100 rounded animate-pulse mt-1.5 hidden sm:block" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 bg-zinc-100 rounded-lg animate-pulse" />
          <div className="w-24 h-9 bg-zinc-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Filters Skeleton */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-zinc-100 rounded-lg w-fit">
        {[1, 2, 3].map(i => (
          <div key={i} className="px-3 py-1.5 flex items-center gap-1.5">
            <div className="h-4 w-16 bg-zinc-200 rounded animate-pulse" />
            <div className="h-4 w-6 bg-zinc-200 rounded-full animate-pulse" />
          </div>
        ))}
      </div>

      {/* Desktop Table Skeleton */}
      <div className="hidden lg:block bg-white border border-border-main rounded-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border-main bg-zinc-50 px-4 py-3 flex gap-4">
          <div className="w-4 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="flex-1 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-20 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-24 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-16 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-20 h-4 bg-zinc-200 rounded animate-pulse" />
        </div>
        
        {/* Rows */}
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-4 py-4 border-b border-border-main last:border-0 flex items-center gap-4">
            <div className="w-4 h-4 bg-zinc-100 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-20" />
            </div>
            <div className="w-16 h-4 bg-zinc-100 rounded animate-pulse" />
            <div className="flex gap-1">
              <div className="w-10 h-5 bg-zinc-100 rounded animate-pulse" />
              <div className="w-12 h-5 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="w-12 h-4 bg-zinc-100 rounded animate-pulse" />
            <div className="w-16 h-5 bg-zinc-100 rounded-full animate-pulse" />
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="w-7 h-7 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Cards Skeleton */}
      <div className="lg:hidden space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-border-main rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-4 h-4 bg-zinc-100 rounded animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-zinc-100 rounded animate-pulse w-20" />
              </div>
              <div className="w-6 h-6 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-16 h-6 bg-zinc-100 rounded animate-pulse" />
                <div className="w-16 h-5 bg-zinc-100 rounded-full animate-pulse" />
              </div>
              <div className="w-10 h-4 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-1 pt-3 border-t border-border-main">
              <div className="w-10 h-5 bg-zinc-100 rounded animate-pulse" />
              <div className="w-12 h-5 bg-zinc-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
