// app/learn/[courseSlug]/page.tsx
import { getCourseBySlug } from "@/lib/data";
import { redirect, notFound } from "next/navigation";

export default async function CourseIndexPage({
  params,
}: {
  params: { courseSlug: string };
}) {
  const { courseSlug } = await params;
  const course = await getCourseBySlug(courseSlug);

  if (!course) notFound();

  // Ищем первый урок
  const firstModule = course.modules?.[0];
  const firstLesson = firstModule?.lessons?.[0];

  if (firstLesson) {
    redirect(`/learn/${courseSlug}/${firstLesson.id}`);
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-medium mb-4">{course.title}</h1>
      <p className="text-text-secondary">В этом курсе пока нет уроков.</p>
    </div>
  );
}