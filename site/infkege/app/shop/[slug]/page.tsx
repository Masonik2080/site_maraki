// app/shop/[slug]/page.tsx
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ProductsService } from '@/lib/services/products.service';
import { PackagePurchaseClient } from '@/components/shop/package-purchase-client';
import { ArrowLeft, Check, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ access?: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const course = ProductsService.getCourseById(slug);
  
  return {
    title: course ? `${course.title} — InfKege` : 'Курс не найден',
    description: course?.description,
  };
}

export default async function CourseShopPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { access } = await searchParams;
  const course = ProductsService.getCourseById(slug);
  
  if (!course) {
    notFound();
  }

  const packages = ProductsService.getCoursePackages(course.id);
  const bulkPurchase = ProductsService.getCourseBulkPurchase(course.id);

  const accessDenied = access === 'denied';

  return (
    <div className="layout-container py-10 min-h-[80vh]">
      {/* Access denied alert */}
      {accessDenied && (
        <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800 dark:text-amber-200">
              Для доступа к курсу необходима покупка
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
              Выберите подходящий пакет ниже и оформите заказ.
            </p>
          </div>
        </div>
      )}

      {/* Back link */}
      <Link 
        href="/shop" 
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        Назад в магазин
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Left: Course Info */}
        <div>
          {/* Thumbnail */}
          {course.thumbnailUrl && (
            <div className="aspect-video w-full rounded-2xl overflow-hidden mb-6 bg-[--color-zinc-100]">
              <img 
                src={course.thumbnailUrl} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Title */}
          <div className="mb-6">
            {course.subtitle && (
              <div className="flex items-center gap-1.5 text-xs font-medium text-action mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="uppercase tracking-wide">{course.subtitle}</span>
              </div>
            )}
            <h1 className="text-3xl font-bold text-text-primary mb-3">
              {course.title}
            </h1>
            {course.description && (
              <p className="text-text-secondary text-lg leading-relaxed">
                {course.description}
              </p>
            )}
          </div>

          {/* Features */}
          {course.features && course.features.length > 0 && (
            <div className="border border-border-main rounded-2xl p-6 bg-[--color-page-bg]">
              <h3 className="font-semibold text-text-primary mb-4">Что входит:</h3>
              <ul className="space-y-3">
                {course.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-text-primary">
                    <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Purchase Options */}
        <div>
          <div className="sticky top-28">
            <PackagePurchaseClient 
              course={course}
              packages={packages}
              bulkPurchase={bulkPurchase}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
