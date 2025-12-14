"use client";

import React, { useState } from "react";
import JSZip from "jszip";
import { 
  FileText, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  PackageOpen, 
  FileCode, 
  FileSpreadsheet, 
  Loader2,
  Folder
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FileDTO } from "@/lib/data";

interface SmartFileItemProps {
  file: FileDTO;
}

// Хелпер для иконок по расширению
const getFileIcon = (name: string) => {
  const ext = name.split(".").pop()?.toLowerCase();
  if (["py", "js", "cpp", "c", "java"].includes(ext || "")) return <FileCode size={16} className="text-blue-500" />;
  if (["xls", "xlsx", "csv"].includes(ext || "")) return <FileSpreadsheet size={16} className="text-green-500" />;
  if (name.endsWith("/")) return <Folder size={16} className="text-yellow-500" fill="currentColor" fillOpacity={0.2} />;
  return <FileText size={16} className="text-zinc-400" />;
};

export function SmartFileItem({ file }: SmartFileItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [zipContent, setZipContent] = useState<JSZip.JSZipObject[]>([]);
  const [zipInstance, setZipInstance] = useState<JSZip | null>(null);

  const isZip = file.name.toLowerCase().endsWith(".zip");

  const toggleZipContent = async (e: React.MouseEvent) => {
    e.preventDefault(); // Чтобы не сработала ссылка на скачивание всего архива
    
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    if (zipContent.length > 0) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    try {
      // 1. Скачиваем архив как Blob
      const response = await fetch(file.url);
      const blob = await response.blob();
      
      // 2. Читаем структуру через JSZip
      const zip = await JSZip.loadAsync(blob);
      setZipInstance(zip);
      
      // 3. Превращаем в массив файлов (фильтруем папки __MACOSX и скрытые файлы)
      const files: JSZip.JSZipObject[] = [];
      zip.forEach((relativePath, zipEntry) => {
        if (!relativePath.startsWith("__MACOSX") && !relativePath.includes("/.") && !zipEntry.dir) {
          files.push(zipEntry);
        }
      });
      
      // Сортируем по имени
      files.sort((a, b) => a.name.localeCompare(b.name));
      
      setZipContent(files);
      setIsOpen(true);
    } catch (error) {
      console.error("Ошибка при чтении архива:", error);
      alert("Не удалось прочитать содержимое архива.");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadInnerFile = async (entry: JSZip.JSZipObject, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!entry) return;

    try {
      // Извлекаем конкретный файл
      const blob = await entry.async("blob");
      
      // Создаем ссылку для скачивания
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Убираем путь папок из названия при скачивании
      a.download = entry.name.split("/").pop() || entry.name; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Ошибка скачивания файла:", err);
    }
  };

  return (
    <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-xl overflow-hidden shadow-sm transition-all hover:shadow-md group">
      
      {/* --- ГЛАВНАЯ СТРОКА --- */}
      <div className="flex items-center justify-between p-4">
        
        {/* Инфо о файле */}
        <a 
          href={file.url} 
          download 
          target="_blank"
          className="flex items-center gap-4 flex-1 min-w-0 group/link"
        >
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            isZip ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" : "bg-[--color-zinc-50] text-[--color-text-secondary] border border-[--color-border-main]"
          )}>
            {isZip ? <PackageOpen size={24} strokeWidth={1.5} /> : <FileText size={24} strokeWidth={1.5} />}
          </div>
          
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-medium text-text-primary truncate group-hover/link:text-action transition-colors">
              {file.name}
            </span>
            <span className="text-xs text-text-secondary">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </a>

        {/* Кнопки действия */}
        <div className="flex items-center gap-2">
          
          {/* Кнопка "Что внутри" (Только для ZIP) */}
          {isZip && (
            <Button
              variant="outline"
              size="sm"
              onClick={toggleZipContent}
              className={cn(
                "hidden sm:flex items-center gap-1.5 text-xs font-medium transition-all",
                isOpen ? "bg-[--color-zinc-100] text-[--color-text-primary] border-[--color-border-main]" : "text-[--color-text-secondary] border-transparent hover:border-[--color-border-main] hover:bg-[--color-zinc-50]"
              )}
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : (isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
              {isOpen ? "Скрыть" : "Что внутри?"}
            </Button>
          )}

          {/* Кнопка скачивания всего архива */}
          <a
            href={file.url}
            download
            target="_blank" 
            className="p-2.5 text-[--color-text-secondary] hover:text-[--color-action] hover:bg-[--color-zinc-50] rounded-lg transition-colors border border-transparent hover:border-[--color-border-main]"
            title="Скачать файл целиком"
          >
            <Download size={20} strokeWidth={1.5} />
          </a>
        </div>
      </div>

      {/* --- ВЫПАДАЮЩИЙ СПИСОК (ACCORDION) --- */}
      {isOpen && (
        <div className="border-t border-[--color-border-main] bg-[--color-zinc-50] animate-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 text-[11px] uppercase font-bold text-text-secondary tracking-wider flex items-center gap-2">
            <Folder size={14} /> Содержимое архива
          </div>
          
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {zipContent.length === 0 ? (
              <div className="p-4 text-sm text-text-secondary text-center italic">
                Архив пуст или файлы скрыты
              </div>
            ) : (
              <div className="divide-y divide-border-main/40">
                {zipContent.map((entry, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-center justify-between px-4 py-2.5 hover:bg-[--color-page-bg] transition-colors group/item"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {getFileIcon(entry.name)}
                      <span className="text-sm text-text-primary truncate font-mono text-[13px]">
                        {entry.name}
                      </span>
                    </div>
                    
                    <button
                      onClick={(e) => downloadInnerFile(entry, e)}
                      className="p-1.5 text-[--color-text-secondary] hover:text-[--color-action] hover:bg-[--color-zinc-100] rounded-md opacity-0 group-hover/item:opacity-100 transition-all flex items-center gap-2 text-xs font-medium"
                      title="Скачать только этот файл"
                    >
                      <span className="hidden sm:inline">Скачать</span>
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-[--color-zinc-100] px-4 py-2 text-[10px] text-[--color-text-secondary] text-center border-t border-[--color-border-main]">
            Вы можете скачать отдельные файлы без распаковки всего архива
          </div>
        </div>
      )}
    </div>
  );
}