"use client";

import { Layers, PanelLeftClose, PanelLeft, Eye, EyeOff, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  sidebarOpen: boolean;
  showPreview: boolean;
  onToggleSidebar: () => void;
  onTogglePreview: () => void;
  onExport: () => void;
}

export function Header({
  sidebarOpen,
  showPreview,
  onToggleSidebar,
  onTogglePreview,
  onExport,
}: HeaderProps) {
  return (
    <header className="h-12 border-b border-[--color-border-main] flex items-center justify-between px-4 bg-[--color-page-bg]">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-bg-secondary] rounded-md transition-all"
        >
          {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-[--color-action]" />
          <span className="text-sm font-semibold text-[--color-text-primary]">Редактор блоков</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onTogglePreview}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-all",
            showPreview
              ? "bg-[--color-action]/10 border-[--color-action]/30 text-[--color-action]"
              : "border-[--color-border-main] text-[--color-text-secondary] hover:text-[--color-text-primary]"
          )}
        >
          {showPreview ? <Eye size={14} /> : <EyeOff size={14} />}
          Превью
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[--color-border-main] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-bg-secondary] transition-all"
        >
          <Save size={14} />
          Экспорт
        </button>
      </div>
    </header>
  );
}
