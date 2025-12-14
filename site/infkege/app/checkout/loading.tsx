// app/checkout/loading.tsx
export default function CheckoutLoading() {
  return (
    <div className="layout-container py-10 min-h-[80vh] animate-pulse">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="h-8 w-48 bg-zinc-200 dark:bg-zinc-800 rounded mb-8" />
        
        {/* Order summary */}
        <div className="bg-white dark:bg-zinc-900 border border-border-main rounded-xl p-6 mb-6">
          <div className="h-5 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
          {[1, 2].map(i => (
            <div key={i} className="flex justify-between items-center py-3 border-b border-border-main last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded" />
                <div className="h-4 w-40 bg-zinc-100 dark:bg-zinc-800 rounded" />
              </div>
              <div className="h-5 w-20 bg-zinc-200 dark:bg-zinc-800 rounded" />
            </div>
          ))}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-border-main">
            <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-6 w-24 bg-zinc-200 dark:bg-zinc-800 rounded" />
          </div>
        </div>
        
        {/* Payment methods */}
        <div className="bg-white dark:bg-zinc-900 border border-border-main rounded-xl p-6">
          <div className="h-5 w-40 bg-zinc-200 dark:bg-zinc-800 rounded mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            ))}
          </div>
          <div className="h-12 w-full bg-action/20 rounded-lg mt-6" />
        </div>
      </div>
    </div>
  );
}
