import React, { Suspense } from "react";
import { getCourseBySlug } from "@/lib/data";
import { notFound, redirect } from "next/navigation";
import { AuthRepository, AccessRepository } from "@/lib/dao";
import { LearnClientLayout } from "./_components/layout-client";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ courseSlug: string }>;
}

// Separate async component for auth/access checks
async function LearnLayoutContent({ 
  courseSlug, 
  children 
}: { 
  courseSlug: string; 
  children: React.ReactNode 
}) {
  // 1. Проверяем авторизацию
  const user = await AuthRepository.getCurrentUser();
  
  if (!user) {
    redirect(`/login?redirect=/learn/${courseSlug}`);
  }
  
  // 2. Получаем курс
  const course = await getCourseBySlug(courseSlug);

  if (!course) notFound();
  
  // 3. Проверяем доступ к курсу (по id, slug из URL и slug из курса)
  const [hasAccessById, hasAccessByUrlSlug, hasAccessByCourseSlug] = await Promise.all([
    AccessRepository.hasAccess(user.id, course.id),
    AccessRepository.hasAccess(user.id, courseSlug),
    course.slug !== courseSlug ? AccessRepository.hasAccess(user.id, course.slug) : Promise.resolve(false)
  ]);
  
  const hasAccess = hasAccessById || hasAccessByUrlSlug || hasAccessByCourseSlug;
  
  if (!hasAccess) {
    // Нет доступа — редирект на страницу покупки
    redirect(`/shop/${courseSlug}?access=denied`);
  }
  
  // 4. Получаем пакеты пользователя для курсов с пакетами (для отображения в sidebar)
  const { isCourseWithPackages } = await import('@/lib/config/packages.config');
  let userPackages: string[] = [];
  if (isCourseWithPackages(courseSlug)) {
    userPackages = await AccessRepository.getUserPackagesForCourse(user.id, courseSlug);
  }

  return (
    <LearnClientLayout course={course} courseSlug={courseSlug} userPackages={userPackages}>
      {children}
    </LearnClientLayout>
  );
}

// Loading fallback for the layout
function LayoutLoading() {
  return (
    <div className="flex h-screen items-center justify-center bg-[--color-page-bg]">
      <div className="animate-pulse text-text-secondary">Загрузка...</div>
    </div>
  );
}

export default async function LearnLayout({ children, params }: LayoutProps) {
  const { courseSlug } = await params;

  return (
    <Suspense fallback={<LayoutLoading />}>
      <LearnLayoutContent courseSlug={courseSlug}>
        {children}
      </LearnLayoutContent>
    </Suspense>
  );
}