// app/pay/[code]/loading.tsx
export default function PayLoading() {
  return (
    <div className="min-h-screen bg-[--color-page-bg] flex items-center justify-center p-4 animate-pulse">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-zinc-900 border border-border-main rounded-2xl p-8 shadow-lg">
          {/* Logo */}
          <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl mx-auto mb-6" />
          
          {/* Amount */}
          <div className="h-10 w-32 bg-zinc-200 dark:bg-zinc-800 rounded-lg mx-auto mb-2" />
          <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800/50 rounded mx-auto mb-8" />
          
          {/* Description */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 mb-6">
            <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-700 rounded mb-2" />
            <div className="h-4 w-3/4 bg-zinc-200 dark:bg-zinc-700 rounded" />
          </div>
          
          {/* Payment methods */}
          <div className="space-y-3 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-14 bg-zinc-100 dark:bg-zinc-800 rounded-xl" />
            ))}
          </div>
          
          {/* Button */}
          <div className="h-12 w-full bg-action/20 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
