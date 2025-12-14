import Link from "next/link";
import { Zap, User, BookOpen, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CourseDTO } from "@/lib/data";

interface CourseCardProps {
  course: CourseDTO;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/learn/${course.slug}`} className="block h-full group">
      <Card className="flex flex-col h-full hover:border-action/30 transition-colors duration-300 relative">
        {course.popular && (
          <div className="absolute top-4 right-4 bg-action text-white text-xs font-medium px-2.5 py-1 rounded-full z-10 shadow-sm">
            Популярное
          </div>
        )}

        <div className="aspect-video w-full bg-bg-secondary border-b border-border-main relative overflow-hidden">
          {course.thumbnailUrl ? (
            <img
              src={course.thumbnailUrl}
              alt={course.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary">
              <BookOpen size={32} />
            </div>
          )}
        </div>

        <div className="p-6 flex flex-col flex-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-bg-secondary text-action">
              {course.iconName === "User" ? <User size={14} /> : <Zap size={14} />}
            </span>
            <span className="text-xs font-medium text-action uppercase tracking-wider">
              {course.subtitle}
            </span>
          </div>

          <h3 className="text-lg font-medium text-text-primary mb-2 group-hover:text-action transition-colors">
            {course.title}
          </h3>

          <p className="text-sm text-text-secondary mb-6 line-clamp-3">
            {course.description}
          </p>

          <div className="mt-auto space-y-3 mb-6">
            {course.features?.slice(0, 3).map((feature, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-action/60 mt-0.5 shrink-0" />
                <span className="text-sm text-text-primary/80 line-clamp-1">
                  {feature.text}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-5 border-t border-border-main flex items-center justify-between gap-4 mt-auto">
            <div className="flex flex-col">
              {course.price > 0 ? (
                <>
                  {course.originalPrice && (
                    <span className="text-sm text-text-secondary line-through decoration-text-secondary/50">
                      {formatPrice(course.originalPrice)}
                    </span>
                  )}
                  <span className="text-lg font-medium text-text-primary">
                    {formatPrice(course.price)}
                  </span>
                </>
              ) : (
                <span className="text-lg font-medium text-text-primary">
                  Бесплатно
                </span>
              )}
            </div>
            <Button className="shrink-0 group-hover:bg-action-hover">
              Начать
            </Button>
          </div>
        </div>
      </Card>
    </Link>
  );
}