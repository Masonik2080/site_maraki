"use client"; // Обязательно use client, так как мы используем динамический импорт

import React from "react";
import dynamic from "next/dynamic";
import { FileText, Loader2 } from "lucide-react";

// Динамический импорт для отключения SSR, так как PDF рендерится в браузере
const CustomPdfViewer = dynamic(
  () => import("./custom-pdf-viewer"),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-96 bg-zinc-50 border border-border-main rounded-xl flex items-center justify-center text-text-secondary gap-2">
        <Loader2 className="animate-spin" size={20} />
        Загрузка PDF вьюера...
      </div>
    )
  }
);

interface PdfBlockProps {
  title?: string;
  fileUrl?: string;
}

export function PdfBlock({ title, fileUrl }: PdfBlockProps) {
  if (!fileUrl) return null;

  return (
    <div className="mb-12 w-full">
      {/* Небольшой заголовок над вьюером */}
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="bg-red-50 p-1.5 rounded-md text-red-600">
           <FileText size={16} />
        </div>
        <h4 className="text-sm font-bold text-text-primary uppercase tracking-wide">
          {title || "Просмотр документа"}
        </h4>
      </div>

      {/* Наш красивый компонент */}
      <CustomPdfViewer fileUrl={fileUrl} title={title} />
    </div>
  );
}