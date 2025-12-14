"use client";

import React from "react";
import Link from "next/link";
import { PanelLeftOpen, ArrowLeft, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface CourseStatusBarProps {
  courseTitle: string;
  isSidebarOpen: boolean;
  onOpenSidebar: () => void;
}

export function CourseStatusBar({ 
  courseTitle, 
  isSidebarOpen, 
  onOpenSidebar 
}: CourseStatusBarProps) {
  return (
    <div className="w-full h-14 flex items-center justify-between px-4 lg:px-8 border-b border-[--color-border-main] bg-[--color-page-bg]/80 backdrop-blur-sm">
        
        {/* ЛЕВАЯ ЧАСТЬ: Кнопка меню (если закрыто) + Название */}
        <div className="flex items-center gap-3 overflow-hidden">
           
           {/* Кнопка появления сайдбара */}
           <div className={cn("transition-all duration-300 ease-in-out", isSidebarOpen ? "w-0 opacity-0 -ml-2" : "w-auto opacity-100")}>
             <button 
                onClick={onOpenSidebar}
                className="p-2 text-text-secondary hover:text-text-primary hover:bg-zinc-100 rounded-md transition-colors"
                title="Открыть меню курса"
             >
                <PanelLeftOpen size={20} />
             </button>
           </div>

           <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 text-xs sm:text-sm text-text-secondary min-w-0">
               <span className="whitespace-nowrap shrink-0">Вы находитесь на:</span>
               <span className="font-medium text-text-primary truncate max-w-[200px] sm:max-w-md lg:max-w-2xl" title={courseTitle}>
                 {courseTitle}
               </span>
           </div>
        </div>
        
        {/* ПРАВАЯ ЧАСТЬ: Ссылка на главную */}
        <Link 
            href="/" 
            className="flex items-center gap-2 text-xs font-medium text-text-secondary hover:text-action transition-colors shrink-0 ml-4 group"
        >
           <span className="hidden sm:inline">Перейти на главную страницу сайта</span>
           <span className="sm:hidden">На главную</span>
           <Home size={14} className="group-hover:text-action transition-colors" />
        </Link>
    </div>
  );
}