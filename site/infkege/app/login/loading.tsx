// app/login/loading.tsx
export default function LoginLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-pulse">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-zinc-900 border border-border-main rounded-2xl p-8">
          {/* Logo */}
          <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-xl mx-auto mb-6" />
          
          {/* Title */}
          <div className="h-7 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mx-auto mb-2" />
          <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800/50 rounded mx-auto mb-8" />
          
          {/* Form fields */}
          <div className="space-y-4">
            <div>
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            </div>
            <div>
              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded mb-2" />
              <div className="h-11 w-full bg-zinc-100 dark:bg-zinc-800 rounded-lg" />
            </div>
          </div>
          
          {/* Button */}
          <div className="h-11 w-full bg-action/20 rounded-lg mt-6" />
          
          {/* Links */}
          <div className="flex justify-center gap-4 mt-6">
            <div className="h-4 w-24 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
            <div className="h-4 w-28 bg-zinc-100 dark:bg-zinc-800/50 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}
