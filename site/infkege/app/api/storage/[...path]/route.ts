import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { AuthRepository } from "@/lib/dao";

// Папки, требующие авторизации (платный контент)
const PROTECTED_FOLDERS = ["pdf", "videos", "premium"];

function getContentType(ext: string) {
  const types: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".pdf": "application/pdf",
    ".zip": "application/zip",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return types[ext.toLowerCase()] || "application/octet-stream";
}

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ path: string[] }> }
) {
  const params = await props.params;
  
  // 1. Проверяем авторизацию для защищённых папок
  const firstFolder = params.path[0]?.toLowerCase();
  if (PROTECTED_FOLDERS.includes(firstFolder)) {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // TODO: Можно добавить проверку доступа к конкретному курсу
    // через AccessRepository.hasAccess(user.id, courseId)
  }
  
  // 2. Получаем базовый путь из ENV
  const storageRoot = process.env.LOCAL_STORAGE_PATH;

  if (!storageRoot) {
    return new NextResponse("Server Configuration Error: LOCAL_STORAGE_PATH missing", { status: 500 });
  }

  // 2. Собираем путь к файлу из URL
  // URL: /api/storage/editor-uploads/file.png -> params.path: ['editor-uploads', 'file.png']
  const relativePath = params.path.join("/");
  
  // Полный путь на диске: C:\Users\...\storage\editor-uploads\file.png
  const filePath = path.join(storageRoot, ...params.path);

  // 3. Защита от Path Traversal (чтобы нельзя было скачать C:\Windows\...)
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(storageRoot);
  
  if (!resolvedPath.startsWith(resolvedRoot)) {
    return new NextResponse("Access Denied", { status: 403 });
  }

  // 4. Проверяем существование файла
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    return new NextResponse("File not found", { status: 404 });
  }

  try {
    // 5. Читаем файл
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType = getContentType(ext);

    // 6. Отдаем файл с правильным заголовком
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        // Опционально: кэширование на час
        "Cache-Control": "public, max-age=3600, s-maxage=3600", 
      },
    });
  } catch (error) {
    console.error("Error reading file:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}