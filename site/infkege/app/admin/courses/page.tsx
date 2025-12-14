"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  ChevronRight,
  Loader2,
  AlertCircle,
  Plus,
  Pencil,
  Eye,
  EyeOff,
} from "lucide-react";
import { useCourses, useCreateCourse } from "@/components/admin/hooks/use-courses";
import { CreateCourseModal } from "@/components/admin/modals/create-course-modal";
import { EditCourseModal } from "@/components/admin/modals/edit-course-modal";

export default function CoursesPage() {
  const { courses, loading, error, refetch } = useCourses();
  const { create, creating } = useCreateCourse();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  const handleCreate = async (data: { title: string; slug: string }) => {
    const success = await create(data);
    if (success) {
      setCreateModalOpen(false);
      refetch();
    }
    return success;
  };

  const openEditModal = (course: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCourse(course);
  };

  const formatPrice = (price: number) =>
    price === 0 ? "Бесплатно" : new Intl.NumberFormat("ru-RU").format(price) + " ₽";

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="h-12 px-6 flex items-center justify-between border-b border-[--color-border-main]">
        <div className="flex items-center">
          <h1 className="text-sm font-semibold text-[--color-text-primary]">Курсы</h1>
          <span className="ml-2 text-xs text-[--color-text-secondary]">{courses.length} шт.</span>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          disabled={creating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[--color-action] text-[--color-action-text] hover:bg-[--color-action-hover] transition-all disabled:opacity-50"
        >
          <Plus size={14} />
          Создать
        </button>
      </header>

      <div className="p-6">
        {loading && (
          <div className="flex items-center justify-center py-16 text-[--color-text-secondary]">
            <Loader2 size={20} className="animate-spin mr-2" />
            Загрузка...
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center py-16 text-red-500">
            <AlertCircle size={20} className="mr-2" />
            {error}
          </div>
        )}

        {!loading && !error && courses.length === 0 && (
          <div className="text-center py-16 text-[--color-text-secondary]">
            <BookOpen size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Нет курсов</p>
          </div>
        )}

        {!loading && !error && courses.length > 0 && (
          <div className="space-y-2">
            {courses.map((course: any) => {
              const isHidden = course.isPublic === false;
              return (
                <div
                  key={course.id}
                  className={`group flex items-center gap-4 p-4 bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg hover:border-[--color-action]/30 transition-all ${
                    isHidden ? "opacity-60" : ""
                  }`}
                >
                  <Link
                    href={`/admin/courses/${course.slug}`}
                    className="p-2.5 bg-[--color-action]/10 rounded-lg text-[--color-action] hover:bg-[--color-action]/20 transition-colors"
                  >
                    <BookOpen size={18} />
                  </Link>

                  <Link href={`/admin/courses/${course.slug}`} className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[--color-text-primary] truncate hover:text-[--color-action] transition-colors">
                        {course.title}
                      </h3>
                      {isHidden && (
                        <span className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          <EyeOff size={10} />
                          скрыт
                        </span>
                      )}
                      {course.isPreorder && (
                        <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                          предзаказ
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[--color-text-secondary] truncate mt-0.5">
                      {course.modules?.length || 0} модулей •{" "}
                      {course.modules?.reduce((a: number, m: any) => a + (m.lessons?.length || 0), 0) || 0}{" "}
                      уроков
                    </p>
                  </Link>

                  {/* Price & Actions */}
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[--color-text-primary]">
                        {formatPrice(course.price || 0)}
                      </div>
                      {course.originalPrice && (
                        <div className="text-[10px] text-[--color-text-secondary] line-through">
                          {formatPrice(course.originalPrice)}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => openEditModal(course, e)}
                      className="p-1.5 text-[--color-text-secondary] hover:text-[--color-action] hover:bg-[--color-action]/10 rounded transition-all lg:opacity-0 lg:group-hover:opacity-100"
                      title="Редактировать"
                    >
                      <Pencil size={14} />
                    </button>

                    <Link
                      href={`/admin/courses/${course.slug}`}
                      className="p-1.5 text-[--color-text-secondary] hover:text-[--color-action] transition-colors"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <CreateCourseModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreate={handleCreate}
      />

      <EditCourseModal
        open={!!editingCourse}
        course={editingCourse}
        onClose={() => setEditingCourse(null)}
        onSave={refetch}
      />
    </div>
  );
}
