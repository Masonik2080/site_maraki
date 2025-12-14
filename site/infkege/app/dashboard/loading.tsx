// app/dashboard/loading.tsx
// Streaming loading skeleton for dashboard
export default function DashboardLoading() {
  return (
    <div className="layout-container py-10 min-h-[80vh] animate-pulse">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[--color-zinc-200]" />
          <div>
            <div className="h-6 w-40 bg-[--color-zinc-200] rounded mb-1.5" />
            <div className="h-4 w-52 bg-[--color-zinc-100] rounded" />
          </div>
        </div>
        <div className="bg-[--color-page-bg] border border-border-main rounded-xl px-4 py-2.5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[--color-zinc-100]" />
          <div>
            <div className="h-3 w-10 bg-[--color-zinc-100] rounded mb-1" />
            <div className="h-4 w-16 bg-[--color-zinc-200] rounded" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-main mb-8">
        <div className="pb-3 border-b-2 border-action">
          <div className="h-4 w-20 bg-action/30 rounded" />
        </div>
        <div className="pb-3">
          <div className="h-4 w-28 bg-[--color-zinc-200] rounded" />
        </div>
        <div className="pb-3">
          <div className="h-4 w-20 bg-[--color-zinc-200] rounded" />
        </div>
      </div>

      {/* Course cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[--color-page-bg] border border-border-main rounded-xl overflow-hidden">
            <div className="aspect-video bg-[--color-zinc-100]" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 bg-[--color-zinc-200] rounded" />
              <div className="h-3.5 w-1/2 bg-[--color-zinc-100] rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
