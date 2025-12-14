import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const COURSES_DIR = path.join(process.cwd(), "data/api/courses");

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; lessonId: string }> }
) {
  try {
    const { slug, lessonId } = await params;
    const { contentBlocks } = await request.json();
    const filePath = path.join(COURSES_DIR, `${slug}.json`);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Course file not found" }, { status: 404 });
    }

    const fileContent = fs.readFileSync(filePath, "utf8");
    const courseData = JSON.parse(fileContent);

    // Ищем урок в variants (для сборников)
    if (courseData.variants) {
      const variant = courseData.variants.find((v: any) => v.id === lessonId || v.slug === lessonId);
      if (variant) {
        // Обновляем данные варианта на основе contentBlocks
        // Это упрощенная логика - в реальности нужно маппить обратно
        variant._contentBlocks = contentBlocks;
        fs.writeFileSync(filePath, JSON.stringify(courseData, null, 2), "utf8");
        return NextResponse.json({ success: true });
      }
    }

    // Ищем в sections/modules/lessons
    if (courseData.sections) {
      for (const section of courseData.sections) {
        for (const module of section.modules || []) {
          const lesson = module.lessons?.find((l: any) => l.id === lessonId);
          if (lesson) {
            lesson.contentBlocks = contentBlocks;
            fs.writeFileSync(filePath, JSON.stringify(courseData, null, 2), "utf8");
            return NextResponse.json({ success: true });
          }
        }
      }
    }

    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  } catch (error) {
    console.error("Error saving lesson:", error);
    return NextResponse.json({ error: "Failed to save lesson" }, { status: 500 });
  }
}
