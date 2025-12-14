// components/lesson/blocks/text-block.tsx
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

interface TextBlockProps {
  title?: string;
  content?: string;
}

/**
 * Функция жесткого форматирования текста.
 * Превращает каждую новую строку в исходнике в полноценный абзац с отступами.
 */
function formatContent(raw: string): string {
  if (!raw) return "";

  // 1. Если текст уже содержит HTML теги (p, div, ul), возвращаем как есть,
  // но добавляем классы для списков, чтобы они не выглядели голым текстом.
  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw
      .replace(/<ul>/g, '<ul class="list-disc pl-5 space-y-2 my-4">')
      .replace(/<ol>/g, '<ol class="list-decimal pl-5 space-y-2 my-4">');
  }

  // 2. Если это "сырой" текст:
  // Разбиваем по ЛЮБОМУ переносу строки (\n). 
  // Раньше мы искали \n\n, теперь любой \n создаст отдельный блок <p> с отступами.
  return raw
    .split(/\n+/) // Разбиваем по одному или нескольким переносам
    .filter((line) => line.trim() !== "") // Убираем пустые строки
    .map((line) => {
      return `<p>${line.trim()}</p>`;
    })
    .join("");
}

export function TextBlock({ title, content }: TextBlockProps) {
  if (!content) return null;

  const htmlContent = useMemo(() => formatContent(content), [content]);

  return (
    <div className="mb-8 w-full animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Заголовок */}
      {title && (
        <div className="flex items-center gap-3 mb-5">
            <div className="w-1 h-6 bg-action rounded-full shadow-sm" />
            <h3 className="text-lg font-bold text-text-primary tracking-tight uppercase">
              {title}
            </h3>
        </div>
      )}
      
      {/* 
         НАСТРОЙКИ ТИПОГРАФИКИ:
         prose-p:indent-8  -> Красная строка (отступ первой строки абзаца)
         prose-p:mt-0      -> Убираем отступ сверху у абзаца
         prose-p:mb-4      -> Добавляем явный отступ СНИЗУ (разделение абзацев)
         text-justify      -> Выравнивание по ширине
      */}
      <div
        className={cn(
          "prose prose-zinc max-w-none",
          "text-text-primary/90 leading-7",
          
          // --- ГЛАВНЫЕ ИЗМЕНЕНИЯ ЗДЕСЬ ---
          "prose-p:text-[16px]",       // Размер шрифта
          "prose-p:indent-8",          // <--- КРАСНАЯ СТРОКА (отступ слева для первой строки)
          "prose-p:mt-0 prose-p:mb-4", // Отступы МЕЖДУ абзацами (воздух)
          "prose-p:text-justify",      // Выравнивание по ширине
          "prose-p:hyphens-auto",      // Переносы слов
          
          // Стили для заголовков внутри текста (если будут)
          "prose-headings:font-bold prose-headings:text-text-primary prose-headings:mt-6 prose-headings:mb-3",
          
          // Стили для списков
          "prose-li:marker:text-action prose-li:my-1",
          
          // Ссылки
          "prose-a:text-action prose-a:font-medium hover:prose-a:underline"
        )}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}