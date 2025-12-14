import { getCourses } from "@/lib/data";
import { CourseCard } from "@/components/course/course-card";

export default async function HomePage() {
  const courses = await getCourses();

  return (
    <div className="py-12 layout-container">
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-medium text-text-primary tracking-tight mb-3">
          Образовательные программы
        </h1>
        <p className="text-text-secondary text-[15px] leading-relaxed">
          Выберите подходящий формат обучения.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}