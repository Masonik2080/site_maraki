"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, FileText, Folder } from "lucide-react";
import { useCourse } from "@/components/admin/hooks/use-courses";

export default function CourseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { course, loading, error } = useCourse(slug);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[--color-text-secondary]">
        <Loader2 size={20} className="animate-spin mr-2" />
        Загрузка...
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        <AlertCircle size={20} className="mr-2" />
        {error || "Курс не найден"}
      </div>
    );
  }

  // Собираем все уроки из модулей
  const allLessons = course.modules?.flatMap((m) => 
    m.lessons?.map((l) => ({ ...l, moduleName: m.title })) || []
  ) || [];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="h-12 px-6 flex items-center gap-3 border-b border-[--color-border-main]">
        <Link
          href="/admin/courses"
          className="p-1 text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
        >
          <ChevronLeft size={18} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[--color-text-primary] truncate">
            {course.title}
          </h1>
        </div>
      </header>

      <div className="p-6">
        {/* Course Info */}
        <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-[--color-text-primary]">
                {course.sections?.length || 0}
              </div>
              <div className="text-xs text-[--color-text-secondary]">Секций</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[--color-text-primary]">
                {course.modules?.length || 0}
              </div>
              <div className="text-xs text-[--color-text-secondary]">Модулей</div>
            </div>
            <div>
              <div className="text-lg font-bold text-[--color-text-primary]">
                {allLessons.length}
              </div>
              <div className="text-xs text-[--color-text-secondary]">Уроков</div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        <h2 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-3">
          Уроки
        </h2>

        {allLessons.length === 0 ? (
          <div className="text-center py-12 text-[--color-text-secondary]">
            <FileText size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет уроков</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {allLessons.map((lesson, idx) => (
              <Link
                key={lesson.id}
                href={`/admin/courses/${slug}/lessons/${lesson.id}`}
                className="flex items-center gap-3 px-4 py-3 bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg hover:border-[--color-action]/30 transition-all group"
              >
                <span className="text-xs font-mono text-[--color-text-secondary]/50 w-6">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <FileText size={14} className="text-[--color-text-secondary]" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[--color-text-primary] truncate">
                    {lesson.title}
                  </div>
                  <div className="text-[10px] text-[--color-text-secondary] truncate">
                    {lesson.moduleName} • {lesson.contentBlocks?.length || 0} блоков
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-[--color-text-secondary] group-hover:text-[--color-action] transition-colors"
                />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
