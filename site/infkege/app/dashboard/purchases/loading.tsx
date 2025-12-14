// app/dashboard/purchases/loading.tsx
// Instant loading skeleton for purchases page
export default function PurchasesLoading() {
  return (
    <div className="layout-container py-8 min-h-[80vh] animate-pulse">
      {/* Header */}
      <div className="h-7 w-40 bg-[--color-zinc-200] rounded mb-6" />

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-main mb-6">
        <div className="pb-2.5 h-4 w-20 bg-[--color-zinc-100] rounded" />
        <div className="pb-2.5 border-b-2 border-action">
          <div className="h-4 w-28 bg-action/30 rounded" />
        </div>
        <div className="pb-2.5 h-4 w-20 bg-[--color-zinc-100] rounded" />
      </div>

      {/* Orders skeleton */}
      <div className="border border-border-main rounded-xl overflow-hidden bg-[--color-page-bg]">
        {/* Table header */}
        <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-[--color-zinc-50] border-b border-border-main">
          <div className="h-3 w-12 bg-[--color-zinc-200] rounded" />
          <div className="w-24 flex justify-center"><div className="h-3 w-14 bg-[--color-zinc-200] rounded" /></div>
          <div className="w-24 flex justify-end"><div className="h-3 w-12 bg-[--color-zinc-200] rounded" /></div>
          <div className="w-20 flex justify-center"><div className="h-3 w-8 bg-[--color-zinc-200] rounded" /></div>
        </div>
        
        {/* Order rows */}
        <div className="divide-y divide-border-main">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-3">
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-4 w-16 bg-[--color-zinc-200] rounded" />
                    <div className="h-3 w-24 bg-[--color-zinc-100] rounded" />
                  </div>
                  <div className="h-3 w-48 bg-[--color-zinc-100] rounded" />
                </div>
                <div className="w-24 flex justify-center">
                  <div className="h-4 w-16 bg-[--color-zinc-100] rounded" />
                </div>
                <div className="w-24 flex justify-end">
                  <div className="h-4 w-14 bg-[--color-zinc-200] rounded" />
                </div>
                <div className="w-20 flex justify-center">
                  <div className="h-4 w-4 bg-[--color-zinc-100] rounded" />
                </div>
              </div>
              {/* Mobile */}
              <div className="sm:hidden flex justify-between">
                <div>
                  <div className="h-4 w-20 bg-[--color-zinc-200] rounded mb-1" />
                  <div className="h-3 w-32 bg-[--color-zinc-100] rounded" />
                </div>
                <div className="h-4 w-16 bg-[--color-zinc-200] rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
