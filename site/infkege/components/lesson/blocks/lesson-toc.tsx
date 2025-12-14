"use client";

import React, { useEffect, useState } from "react";
import { 
  FileText, 
  Paperclip, 
  ListChecks, 
  PlayCircle, 
  Code2, 
  Hash, 
  AlignLeft,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonBlockDTO } from "@/lib/data";

interface LessonTableOfContentsProps {
  blocks: LessonBlockDTO[];
}

type TocItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  indent: number;
};

export function LessonTableOfContents({ blocks }: LessonTableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  // 1. Парсим блоки и превращаем их в структуру меню
  useEffect(() => {
    const items: TocItem[] = [];
    let currentSection = ""; // Для имитации вложенности

    blocks.forEach((block, index) => {
      const id = `block-${index}`;
      let label = "";
      let icon = <AlignLeft size={14} />;
      let indent = 0;
      let shouldAdd = true;

      // Логика определения заголовка и иконки
      switch (block.type) {
        case "pdf-viewer":
          label = block.title || "Документ PDF";
          icon = <FileText size={14} className="text-blue-500" />;
          break;
        case "files":
          label = "Материалы к уроку";
          icon = <Paperclip size={14} className="text-amber-500" />;
          break;
        case "answers":
          label = block.title || "Ответы";
          icon = <ListChecks size={14} className="text-emerald-500" />;
          currentSection = "answers"; // Маркер, что пошла практика
          break;
        case "rutube":
        case "video":
          label = block.title || "Видеоразбор";
          icon = <PlayCircle size={14} className="text-red-500" />;
          indent = 1; // Вкладываем внутрь
          break;
        case "code":
          label = block.title || "Код решения";
          icon = <Code2 size={14} className="text-purple-500" />;
          indent = 1;
          break;
        case "task":
          label = block.task?.title || "Задача";
          icon = <Hash size={14} className="text-zinc-500" />;
          break;
        case "text":
          // Пытаемся найти заголовки в HTML (простая эвристика)
          if (block.content?.includes("<h1") || block.content?.includes("<h2")) {
             // Очищаем HTML теги для меню
             const div = document.createElement("div");
             div.innerHTML = block.content;
             label = div.textContent || "Раздел";
             icon = <ChevronDown size={14} className="text-text-primary" />;
             currentSection = "section";
             indent = 0;
          } else if (block.content?.includes("Задание №")) {
             // Для заголовков разборов (см. data.ts)
             const div = document.createElement("div");
             div.innerHTML = block.content;
             label = div.textContent || "Задание";
             icon = <ChevronRight size={14} className="text-zinc-400" />;
             indent = 1; 
          } else {
             shouldAdd = false; // Обычный текст не добавляем в меню
          }
          break;
        default:
          shouldAdd = false;
      }

      if (shouldAdd) {
        items.push({ id, label, icon, indent });
      }
    });

    setTocItems(items);
  }, [blocks]);

  // 2. Скролл к блоку
  const scrollToBlock = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  // 3. Подсветка активного блока при скролле (Observer)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" } // Срабатывает, когда блок в верхней части
    );

    blocks.forEach((_, idx) => {
      const el = document.getElementById(`block-${idx}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [blocks]);

  if (tocItems.length === 0) return null;

  return (
    <div className="w-64 shrink-0 hidden xl:block pl-8 sticky top-24 h-[calc(100vh-120px)] overflow-hidden">
      <div className="text-[11px] font-bold text-text-secondary uppercase tracking-widest mb-4 pl-2">
        Содержание
      </div>
      
      <div className="relative border-l border-border-main ml-2 space-y-0.5">
        {tocItems.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToBlock(item.id)}
            className={cn(
              "group flex items-center gap-2 w-full text-left py-1.5 px-3 rounded-md transition-all text-[13px] relative",
              "hover:bg-zinc-100",
              activeId === item.id 
                ? "text-text-primary font-medium bg-zinc-100" 
                : "text-text-secondary"
            )}
            style={{ paddingLeft: `${item.indent * 16 + 12}px` }} // Отступ для вложенности
          >
            {/* Активный маркер слева (как в VS Code) */}
            {activeId === item.id && (
              <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-4 bg-action rounded-r-full" />
            )}

            <span className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
               {item.icon}
            </span>
            <span className="truncate leading-tight">
               {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}