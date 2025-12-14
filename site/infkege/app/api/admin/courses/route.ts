import { NextResponse } from "next/server";
import { getCourses } from "@/lib/data";
import { checkAdminAccess } from "@/lib/dao";

export async function GET() {
  // Используем централизованную проверку админа (DAL паттерн)
  const { isAdmin, error } = await checkAdminAccess();
  if (!isAdmin) return error!;

  try {
    const courses = await getCourses();
    return NextResponse.json(courses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}
