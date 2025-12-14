// app/learn/[courseSlug]/_components/layout-client.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  PanelLeftClose, 
  ChevronDown, 
  PlayCircle, 
  FileText,
  BookCheck,
  Info,
  FileQuestion,
  List,
  FolderOpen,
  CheckCircle2,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CourseDTO, ModuleDTO, SectionDTO } from "@/lib/data";
import { CourseStatusBar } from "./course-status-bar";
import { 
  hasVariantAccess as checkVariantAccess, 
  extractVariantNumber,
  isCourseWithPackages 
} from "@/lib/config/packages.shared";

interface LearnClientLayoutProps {
  children: React.ReactNode;
  course: CourseDTO;
  courseSlug: string;
  userPackages?: string[];
}

export function LearnClientLayout({ children, course, courseSlug, userPackages = [] }: LearnClientLayoutProps) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  // Храним ID открытых модулей
  const [openItems, setOpenItems] = useState<string[]>([]);

  // 1. Авто-раскрытие активного модуля при загрузке страницы
  useEffect(() => {
    if (!course) return;

    let activeModuleIds: string[] = [];

    // Хелпер для поиска модуля, содержащего текущий урок
    const findActiveModuleId = (modules?: ModuleDTO[]) => {
      if (!modules) return null;
      return modules.find(m => m.lessons?.some(l => pathname.includes(l.id)))?.id;
    };

    // Проверяем секции
    if (course.sections?.length) {
      course.sections.forEach(sec => {
        const modId = findActiveModuleId(sec.modules);
        if (modId) activeModuleIds.push(modId);
      });
    } 
    // Проверяем модули в корне (старый формат)
    else if (course.modules?.length) {
      const modId = findActiveModuleId(course.modules);
      if (modId) activeModuleIds.push(modId);
    }

    // Если нашли активный модуль, добавляем его в список открытых
    if (activeModuleIds.length > 0) {
      setOpenItems(prev => [...new Set([...prev, ...activeModuleIds])]);
    }
  }, [course, pathname]);

  const toggleItem = (itemId: string) => {
    setOpenItems((prev) => 
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  return (
    <div className="flex h-screen w-full bg-[--color-page-bg] text-[--color-text-primary] overflow-hidden">
      {/* --- SIDEBAR --- */}
      <aside 
          className={cn(
            "border-r border-[--color-border-main] flex-shrink-0 flex flex-col h-full bg-[--color-bg-secondary] transition-all duration-300 ease-in-out relative group z-30 shadow-lg", 
            isSidebarOpen ? "w-80" : "w-0 border-r-0 overflow-hidden" 
          )}
      >
          {/* Header Сайдбара */}
          <div className="h-14 flex items-center justify-between px-4 shrink-0 border-b border-[--color-border-main] bg-[--color-page-bg] sticky top-0">
             <div className="flex items-center gap-2 text-text-primary font-medium">
                <List size={18} className="text-text-secondary" />
                <span className="text-sm font-semibold tracking-tight select-none">
                  Содержание
                </span>
             </div>
             <button 
                onClick={() => setSidebarOpen(false)} 
                className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-zinc-100 rounded-md transition-colors"
                title="Свернуть меню"
             >
                <PanelLeftClose size={18} />
             </button>
          </div>

          {/* Список уроков */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
               <SidebarContent 
                  course={course} 
                  openItems={openItems} 
                  toggleItem={toggleItem} 
                  pathname={pathname}
                  courseSlug={courseSlug}
                  userPackages={userPackages}
               />
          </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <main className="flex-1 min-w-0 bg-[--color-page-bg] relative flex flex-col h-full overflow-hidden">
         <div className="shrink-0 z-20">
             <CourseStatusBar 
                courseTitle={course.title} 
                isSidebarOpen={isSidebarOpen} 
                onOpenSidebar={() => setSidebarOpen(true)} 
             />
         </div>
         <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth"> 
           {children}
         </div>
      </main>
    </div>
  );
}


// -----------------------------------------------------------------------------
// КОМПОНЕНТЫ СОДЕРЖИМОГО САЙДБАРА
// -----------------------------------------------------------------------------

function SidebarContent({ course, openItems, toggleItem, pathname, courseSlug, userPackages = [] }: any) {
    const hasPackages = isCourseWithPackages(courseSlug);
    
    // 1. СЦЕНАРИЙ: У курса есть СЕКЦИИ (Новый формат, включая Сборник)
    if (course.sections && course.sections.length > 0) {
        // Сортируем секции по order
        const sortedSections = [...course.sections].sort((a, b) => (a.order || 0) - (b.order || 0));

        return (
            <div className="pb-10">
                {sortedSections.map((section: SectionDTO) => (
                    <div key={section.id} className="mb-0">
                        {/* Заголовок Секции (если их несколько или если есть явный заголовок) */}
                        {sortedSections.length > 0 && section.title && (
                             <div className="px-4 py-3 bg-zinc-100/80 border-b border-border-main/50 text-[11px] font-bold uppercase tracking-wider text-text-secondary/80 sticky top-0 z-10 backdrop-blur-sm flex items-center gap-2">
                                <FolderOpen size={12} />
                                {section.title}
                             </div>
                        )}

                        {/* Модули внутри секции */}
                        <div>
                            {section.modules
                                ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((module: ModuleDTO) => (
                                    <ModuleItem 
                                        key={module.id}
                                        module={module}
                                        openItems={openItems}
                                        toggleItem={toggleItem}
                                        pathname={pathname}
                                        courseSlug={courseSlug}
                                        userPackages={userPackages}
                                        hasPackages={hasPackages}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 2. СЦЕНАРИЙ: Только модули (Legacy / Плоский список)
    if (course.modules && course.modules.length > 0) {
        const sortedModules = [...course.modules].sort((a, b) => (a.order || 0) - (b.order || 0));
        return (
            <div className="pb-10">
                {sortedModules.map((module: ModuleDTO) => (
                    <ModuleItem 
                        key={module.id}
                        module={module}
                        openItems={openItems}
                        toggleItem={toggleItem}
                        pathname={pathname}
                        courseSlug={courseSlug}
                        userPackages={userPackages}
                        hasPackages={hasPackages}
                    />
                ))}
            </div>
        );
    }

    return <div className="p-6 text-sm text-text-secondary text-center">Нет доступных материалов.</div>;
}


// --- Компонент Модуля (Аккордеон) ---

function ModuleItem({ module, openItems, toggleItem, pathname, courseSlug, userPackages = [], hasPackages = false }: any) {
    const isOpen = openItems.includes(module.id);
    const isActiveModule = module.lessons?.some((l: any) => pathname.includes(l.id));

    // Подбираем иконку для модуля на основе названия (визуальное украшение, не логика)
    let Icon = FileQuestion;
    let iconColor = "text-text-secondary";
    const titleLower = module.title.toLowerCase();
    
    if (titleLower.includes("ответы") || titleLower.includes("проверка")) {
      Icon = BookCheck;
      iconColor = "text-emerald-600";
    } else if (titleLower.includes("введение") || titleLower.includes("инструкция")) {
      Icon = Info;
      iconColor = "text-blue-600";
    } else if (titleLower.includes("вариант")) {
      Icon = List;
    }

    return (
        <div className="border-b border-border-main/40 last:border-b-0">
            <button
                onClick={() => toggleItem(module.id)}
                className={cn(
                    "w-full flex items-start justify-between px-4 py-3 text-left transition-all group select-none relative",
                    isActiveModule 
                        ? "bg-[--color-page-bg] font-semibold" 
                        : "hover:bg-[--color-zinc-100] bg-[--color-zinc-50]"
                )}
            >
                {isActiveModule && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[--color-action] rounded-r-full" />
                )}

                <div className="flex items-center gap-3 pr-2 min-w-0">
                    <Icon size={18} className={cn("shrink-0 mt-0.5 transition-colors", isActiveModule ? "text-action" : iconColor)} />
                    <span className={cn(
                        "text-[14px] font-medium leading-tight transition-colors line-clamp-2",
                        isActiveModule ? "text-text-primary" : "text-text-secondary group-hover:text-text-primary"
                    )}>
                        {module.title}
                    </span>
                    {module.isFree === false && (
                         <Lock size={12} className="text-text-secondary ml-1" />
                    )}
                </div>
                <ChevronDown size={15} className={cn("text-text-secondary/70 transition-transform duration-200 shrink-0 mt-0.5", isOpen && "rotate-180")} />
            </button>

            {/* Список уроков внутри модуля */}
            {isOpen && (
                <div className="bg-[--color-page-bg] py-1 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
                    {module.lessons
                        ?.sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                        .map((lesson: any) => {
                            const isLessonActive = pathname.includes(lesson.id);
                            
                            // Проверяем доступ к варианту для курсов с пакетами
                            const variantNumber = hasPackages ? extractVariantNumber(lesson.id) : null;
                            const isLocked = variantNumber !== null && !checkVariantAccess(courseSlug, variantNumber, userPackages);
                            
                            // Определяем иконку урока
                            const hasVideo = lesson.contentBlocks?.some((b: any) => b.type === 'video' || b.type === 'rutube');
                            const hasTask = lesson.contentBlocks?.some((b: any) => b.type === 'task');

                            return (
                                <Link
                                    key={lesson.id}
                                    href={`/learn/${courseSlug}/${lesson.id}`}
                                    className={cn(
                                        "relative flex items-center gap-3 py-2 pr-4 pl-12 text-[13px] transition-all leading-snug group/lesson",
                                        isLessonActive
                                            ? "text-[--color-action] font-medium bg-[--color-action]/10 border-l-2 border-[--color-action]"
                                            : isLocked
                                            ? "text-text-secondary/50 hover:text-text-secondary hover:bg-amber-50/50"
                                            : "text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-zinc-50]"
                                    )}
                                >
                                    <div className={cn(
                                        "shrink-0", 
                                        isLessonActive ? "opacity-100 text-action" : 
                                        isLocked ? "opacity-50 text-amber-500" :
                                        "opacity-60 text-text-secondary group-hover/lesson:text-text-primary"
                                    )}>
                                        {isLocked ? <Lock size={14} /> :
                                         hasVideo ? <PlayCircle size={14} /> : 
                                         hasTask ? <CheckCircle2 size={14} /> : 
                                         <FileText size={14} />}
                                    </div>
                                    <span className={cn("line-clamp-2", isLocked && "opacity-70")}>{lesson.title}</span>
                                    {isLocked && (
                                        <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                                            Платно
                                        </span>
                                    )}
                                </Link>
                            );
                    })}
                    {(!module.lessons || module.lessons.length === 0) && (
                        <div className="pl-12 py-2 text-xs text-text-secondary italic">Уроков пока нет</div>
                    )}
                </div>
            )}
        </div>
    );
}