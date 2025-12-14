// app/learn/[courseSlug]/[lessonId]/page.tsx
import { getLessonById, getCourseBySlug } from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Lock, ShoppingCart } from "lucide-react";
import { BlockRenderer } from "@/components/lesson/block-renderer";
import { LessonTableOfContents } from "@/components/lesson/blocks/lesson-toc";
import { AuthRepository, AccessRepository } from "@/lib/dao";
import { 
  extractVariantNumber, 
  getRequiredPackageForVariant, 
  isCourseWithPackages 
} from "@/lib/config/packages.config";

interface PageProps {
  params: Promise<{
    courseSlug: string;
    lessonId: string;
  }>;
}

export default async function LessonPage({ params }: PageProps) {
  const { lessonId, courseSlug } = await params;

  const [lesson, course] = await Promise.all([
    getLessonById(lessonId, courseSlug), 
    getCourseBySlug(courseSlug)
  ]);

  if (!lesson || !course) notFound();
  
  // Проверка доступа к варианту для курсов с пакетами
  let accessDenied = false;
  let requiredPackage: { id: string; name: string; price: number; variantRange: { from: number; to: number } } | null = null;
  
  const variantNumber = extractVariantNumber(lessonId);
  if (variantNumber !== null && isCourseWithPackages(courseSlug)) {
    const user = await AuthRepository.getCurrentUser();
    if (user) {
      const hasVariantAccess = await AccessRepository.hasVariantAccess(
        user.id, 
        courseSlug, 
        variantNumber
      );
      
      if (!hasVariantAccess) {
        accessDenied = true;
        requiredPackage = getRequiredPackageForVariant(courseSlug, variantNumber);
      }
    }
  }
  
  // Показываем страницу "Доступ закрыт" вместо редиректа
  if (accessDenied && requiredPackage) {
    return (
      <div className="flex flex-col h-screen overflow-hidden bg-[--color-page-bg]">
        <header className="h-16 border-b border-[--color-border-main] flex items-center px-6 lg:px-10 shrink-0 bg-[--color-page-bg]/80 backdrop-blur-sm z-20">
          <h1 className="text-lg font-medium text-text-primary">{lesson.title}</h1>
        </header>
        
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
              <Lock className="w-10 h-10 text-amber-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-text-primary mb-3">
              Вариант {variantNumber} недоступен
            </h2>
            
            <p className="text-text-secondary mb-6">
              Для доступа к этому варианту необходимо приобрести{' '}
              <span className="font-medium text-text-primary">{requiredPackage.name}</span>
            </p>
            
            <div className="bg-zinc-50 border border-border-main rounded-xl p-4 mb-6">
              <div className="text-sm text-text-secondary mb-1">Стоимость пакета</div>
              <div className="text-2xl font-bold text-text-primary">
                {requiredPackage.price.toLocaleString('ru-RU')} ₽
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button asChild size="lg" className="w-full">
                <Link href={`/shop/${courseSlug}`}>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Перейти к покупке
                </Link>
              </Button>
              
              <Button asChild variant="outline" size="lg" className="w-full">
                <Link href={`/learn/${courseSlug}`}>
                  Вернуться к курсу
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const allLessons = course.sections?.flatMap(s => s.modules).flatMap(m => m.lessons) 
    || course.modules?.flatMap((m) => m.lessons || []) 
    || [];
    
  const currentIndex = allLessons.findIndex((l) => l.id === lesson.id);
  const prevLesson = allLessons[currentIndex - 1];
  const nextLesson = allLessons[currentIndex + 1];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[--color-page-bg]">
      {/* HEADER */}
      <header className="h-16 border-b border-[--color-border-main] flex items-center justify-between px-6 lg:px-10 shrink-0 bg-[--color-page-bg]/80 backdrop-blur-sm z-20 sticky top-0">
        <div>
          <h1
            className="text-lg font-medium text-text-primary truncate max-w-[calc(100vw-100px)] lg:max-w-3xl"
            title={lesson.title}
          >
            {lesson.title}
          </h1>
        </div>
      </header>

      {/* CONTENT + TOC WRAPPER */}
      <div className="flex-1 overflow-y-auto bg-[--color-page-bg] scroll-smooth">
        <div className="max-w-[1400px] mx-auto">
            
          <div className="flex flex-row items-start justify-center p-6 lg:p-10 gap-10">
            
            {/* LEFT COLUMN: BLOCKS */}
            <div className="flex-1 min-w-0 max-w-[800px] pb-32 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {lesson.contentBlocks.map((block, index) => (
                // Передаем INDEX!
                <BlockRenderer key={index} block={block} index={index} />
              ))}

              {/* FOOTER NAV */}
              <div className="mt-16 pt-8 border-t border-border-main flex items-center justify-between">
                <div>
                  {prevLesson ? (
                    <Button
                      variant="ghost"
                      asChild
                      className="pl-0 hover:bg-transparent hover:text-text-primary text-text-secondary"
                    >
                      <Link
                        href={`/learn/${courseSlug}/${prevLesson.id}`}
                        className="flex flex-col items-start gap-1"
                      >
                        <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                          <ChevronLeft size={14} /> Предыдущий
                        </span>
                        <span className="text-sm max-w-[150px] sm:max-w-[200px] truncate hidden sm:block text-left">
                          {prevLesson.title}
                        </span>
                      </Link>
                    </Button>
                  ) : (
                    <div />
                  )}
                </div>

                <div>
                  {nextLesson ? (
                    <Button
                      variant="ghost"
                      asChild
                      className="pr-0 hover:bg-transparent hover:text-text-primary text-text-primary text-right"
                    >
                      <Link
                        href={`/learn/${courseSlug}/${nextLesson.id}`}
                        className="flex flex-col items-end gap-1"
                      >
                        <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                          Следующий <ChevronRight size={14} />
                        </span>
                        <span className="text-sm max-w-[150px] sm:max-w-[200px] truncate hidden sm:block text-right">
                          {nextLesson.title}
                        </span>
                      </Link>
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="opacity-50 cursor-not-allowed">
                      Курс завершен
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: TOC (Sticky) */}
            {/* Передаем блоки в компонент содержания */}
            <LessonTableOfContents blocks={lesson.contentBlocks} />
            
          </div>
        </div>
      </div>
    </div>
  );
}