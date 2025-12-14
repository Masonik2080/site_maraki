// app/shop/[slug]/loading.tsx
import { Card } from '@/components/ui/card';

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded ${className}`} />;
}

export default function CourseShopLoading() {
  return (
    <div className="layout-container py-10 min-h-[80vh]">
      {/* Back link skeleton */}
      <Skeleton className="h-5 w-36 mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Course Info */}
        <div>
          {/* Thumbnail skeleton */}
          <Skeleton className="aspect-video w-full rounded-2xl mb-6" />

          {/* Title skeleton */}
          <div className="mb-6">
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-9 w-3/4 mb-3" />
            <Skeleton className="h-5 w-full mb-2" />
            <Skeleton className="h-5 w-2/3" />
          </div>

          {/* Features skeleton */}
          <Card className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-5 h-5 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Purchase Options */}
        <div>
          <Card className="p-6">
            <Skeleton className="h-7 w-40 mb-6" />
            
            {/* Package options skeleton */}
            <div className="space-y-4 mb-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 border border-border-main rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>

            {/* Button skeleton */}
            <Skeleton className="h-12 w-full rounded-lg" />
          </Card>
        </div>
      </div>
    </div>
  );
}
