import { NextRequest, NextResponse } from "next/server";
import { getCourseBySlug } from "@/lib/data";
import { checkAdminAccess } from "@/lib/dao";
import fs from "fs";
import path from "path";

const COURSES_DIR = path.join(process.cwd(), "data/api/courses");

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Проверяем права админа
  const { isAdmin, error } = await checkAdminAccess();
  if (!isAdmin) return error!;

  try {
    const { slug } = await params;
    const course = await getCourseBySlug(slug);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }
    return NextResponse.json(course);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch course" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Проверяем права админа
  const { isAdmin, error } = await checkAdminAccess();
  if (!isAdmin) return error!;

  try {
    const { slug } = await params;
    const data = await request.json();
    const filePath = path.join(COURSES_DIR, `${slug}.json`);
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Course file not found" }, { status: 404 });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save course" }, { status: 500 });
  }
}
