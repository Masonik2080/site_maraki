// app/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';
import { AuthRepository, UserRepository, AccessRepository } from '@/lib/dao';
import { getCourses } from '@/lib/data';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Wallet, ShoppingBag, ArrowRight, Sparkles, Hand } from 'lucide-react';
import { RecoveryForm } from '@/components/dashboard/recovery-form';

export const metadata = {
  title: 'Личный кабинет — InfKege',
};

export default async function DashboardPage() {
  // Wait for connection to access cookies
  await connection();
  
  const user = await AuthRepository.getCurrentUser();
  
  if (!user) {
    redirect('/login?redirect=/dashboard');
  }

  const [profile, courseIds, allCourses] = await Promise.all([
    UserRepository.getProfile(user.id),
    AccessRepository.getUserCourseIds(user.id),
    getCourses(),
  ]);

  // Filter courses user has access to
  const myCourses = allCourses.filter(
    course => courseIds.includes(course.id) || courseIds.includes(course.slug)
  );

  const displayName = profile?.fullName || user.email.split('@')[0];

  return (
    <div className="layout-container py-10 min-h-[80vh]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-action/10 flex items-center justify-center">
            <Hand className="w-5 h-5 text-action" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">
              Привет, {displayName}!
            </h1>
            <p className="text-sm text-text-secondary">
              Добро пожаловать в личный кабинет
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-[--color-page-bg] border border-border-main rounded-xl px-4 py-2.5 flex items-center gap-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Wallet className="w-4.5 h-4.5 text-emerald-600" />
            </div>
            <div>
              <div className="text-xs text-text-secondary">Баланс</div>
              <div className="font-semibold text-text-primary text-sm">
                {(profile?.balance || 0).toLocaleString('ru-RU')} ₽
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-main mb-8">
        <Link 
          href="/dashboard" 
          className="pb-3 border-b-2 border-action text-action font-medium text-sm"
        >
          Мои курсы
        </Link>
        <Link 
          href="/dashboard/purchases" 
          className="pb-3 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          История покупок
        </Link>
        <Link 
          href="/dashboard/settings" 
          className="pb-3 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          Настройки
        </Link>
      </div>

      {/* Courses Grid */}
      {myCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {myCourses.map(course => (
            <Link key={course.id} href={`/learn/${course.slug}`} className="block group">
              <Card className="h-full border-border-main hover:border-action/50 transition-all hover:shadow-md overflow-hidden">
                <div className="aspect-video w-full bg-gradient-to-br from-action/5 to-action/10 border-b border-border-main flex items-center justify-center relative">
                  {course.thumbnailUrl ? (
                    <img 
                      src={course.thumbnailUrl} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-9 h-9 text-action/30" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-text-primary mb-1.5 line-clamp-2 group-hover:text-action transition-colors text-sm">
                    {course.title}
                  </h3>
                  <p className="text-xs text-text-secondary flex items-center gap-1">
                    Продолжить обучение
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gradient-to-b from-[--color-zinc-50]/50 to-transparent border border-dashed border-border-main rounded-xl">
          <div className="w-14 h-14 rounded-xl bg-action/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-action" />
          </div>
          <h3 className="font-medium text-text-primary mb-1.5">
            Начните обучение сегодня
          </h3>
          <p className="text-sm text-text-secondary mb-5 max-w-sm mx-auto">
            Выберите пакет вариантов в магазине и получите доступ к материалам для подготовки к ЕГЭ.
          </p>
          <Button asChild className="h-10 px-5 text-sm">
            <Link href="/shop">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Перейти в магазин
            </Link>
          </Button>
        </div>
      )}

      {/* Recovery Notice */}
      <RecoveryForm email={user.email} />
    </div>
  );
}
