import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const COURSES_DIR = path.join(process.cwd(), "data/api/courses");

export async function POST(request: NextRequest) {
  try {
    const { title, slug } = await request.json();

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Создаем директорию если её нет
    if (!fs.existsSync(COURSES_DIR)) {
      fs.mkdirSync(COURSES_DIR, { recursive: true });
    }

    const filePath = path.join(COURSES_DIR, `${slug}.json`);

    // Проверяем что файл не существует
    if (fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Course already exists" }, { status: 409 });
    }

    // Создаем базовую структуру курса
    const courseData = {
      meta: {
        title,
        version: "1.0",
        total_variants: 0,
      },
      variants: [],
      intro: {
        title: "Введение",
        materials: [],
      },
      global_resources: [],
    };

    fs.writeFileSync(filePath, JSON.stringify(courseData, null, 2), "utf8");

    return NextResponse.json({
      success: true,
      slug,
      message: "Course created successfully",
    });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json({ error: "Failed to create course" }, { status: 500 });
  }
}
