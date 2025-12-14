// app/shop/page.tsx
import { connection } from 'next/server';
import { ProductsService } from '@/lib/services/products.service';
import { AuthRepository, CartRepository } from '@/lib/dao';
import { CourseCard } from '@/components/shop/course-card';
import { Sparkle, CalendarCheck, FilmSlate, Lightning, LockKey, ArrowUUpLeft } from '@phosphor-icons/react/dist/ssr';

export const metadata = {
  title: 'Магазин — InfKege',
  description: 'Курсы и материалы для подготовки к ЕГЭ по информатике',
};

export default async function ShopPage() {
  // Wait for connection to access cookies
  await connection();
  
  const courses = ProductsService.getAllCourses();
  const paidCourses = courses.filter(c => c.price > 0);
  const freeCourses = courses.filter(c => c.price === 0);
  
  // Get cart product IDs if user is logged in
  let cartProductIds: string[] = [];
  const user = await AuthRepository.getCurrentUser();
  if (user) {
    const cart = await CartRepository.getOrCreateCart(user.id);
    cartProductIds = cart.items.map(item => item.productId);
  }

  return (
    <div className="layout-container py-10 min-h-[80vh]">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-xs font-medium text-emerald-600 mb-5">
          <Sparkle className="w-3.5 h-3.5" weight="fill" />
          Обновлено для ЕГЭ 2026
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-4">
          Образовательные программы
        </h1>
        <p className="text-text-secondary text-lg leading-relaxed">
          Выберите подходящий формат обучения для подготовки к ЕГЭ по информатике
        </p>
      </div>

      {/* Paid Courses */}
      {paidCourses.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Платные курсы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paidCourses.map((course) => (
              <CourseCard key={course.id} course={course} cartProductIds={cartProductIds} />
            ))}
          </div>
        </section>
      )}

      {/* Free Courses */}
      {freeCourses.length > 0 && (
        <section className="mb-16">
          <h2 className="text-xl font-semibold text-text-primary mb-6">
            Бесплатные материалы
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeCourses.map((course) => (
              <CourseCard key={course.id} course={course} cartProductIds={cartProductIds} />
            ))}
          </div>
        </section>
      )}

      {/* Perks */}
      <div className="mt-20 py-6 border-y border-border-main">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-text-secondary">
          <span className="inline-flex items-center gap-1.5"><CalendarCheck weight="bold" className="w-4 h-4" /> Формат ЕГЭ 2026</span>
          <span className="inline-flex items-center gap-1.5"><FilmSlate weight="bold" className="w-4 h-4" /> Видео-разборы</span>
          <span className="inline-flex items-center gap-1.5"><Lightning weight="bold" className="w-4 h-4" /> Доступ сразу</span>
          <span className="inline-flex items-center gap-1.5"><LockKey weight="bold" className="w-4 h-4" /> Безопасная оплата</span>
          <span className="inline-flex items-center gap-1.5"><ArrowUUpLeft weight="bold" className="w-4 h-4" /> Возврат 14 дней</span>
        </div>
      </div>
    </div>
  );
}
