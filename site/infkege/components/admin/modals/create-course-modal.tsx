"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateCourseModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (data: { title: string; slug: string }) => Promise<boolean>;
}

export function CreateCourseModal({ open, onClose, onCreate }: CreateCourseModalProps) {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!title.trim() || !slug.trim()) {
      setError("Заполните все поля");
      return;
    }

    setLoading(true);
    setError(null);

    const success = await onCreate({ title, slug });
    if (success) {
      setTitle("");
      setSlug("");
      onClose();
    } else {
      setError("Ошибка при создании курса");
    }
    setLoading(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="modal-content rounded-xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-6 border-b border-[--color-border-main] bg-[--color-bg-secondary]/50">
          <h2 className="text-base font-bold text-[--color-text-primary]">Создать курс</h2>
          <button
            onClick={onClose}
            className="p-1.5 text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-bg-secondary] rounded-md transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-2 block">
              Название курса
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Введите название"
              autoFocus
              className="w-full h-9 px-3 text-sm bg-[--color-page-bg] border border-[--color-border-main] rounded-lg text-[--color-text-primary] placeholder:text-[--color-text-secondary]/40 focus:border-[--color-action] focus:ring-2 focus:ring-[--color-action]/20 outline-none transition-all"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-2 block">
              Slug (для URL)
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
              placeholder="course-slug"
              className="w-full h-9 px-3 text-sm font-mono bg-[--color-page-bg] border border-[--color-border-main] rounded-lg text-[--color-text-primary] placeholder:text-[--color-text-secondary]/40 focus:border-[--color-action] focus:ring-2 focus:ring-[--color-action]/20 outline-none transition-all"
            />
            <p className="text-[10px] text-[--color-text-secondary] mt-2 px-1">
              Файл: <span className="font-mono text-[--color-action]">{slug || "course-slug"}.json</span>
            </p>
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 h-14 px-6 border-t border-[--color-border-main] bg-[--color-bg-secondary]/30">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-lg border border-[--color-border-main] text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-bg-secondary] transition-all disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !title.trim() || !slug.trim()}
            className={cn(
              "flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all",
              loading || !title.trim() || !slug.trim()
                ? "bg-[--color-action]/40 text-[--color-action-text]/60 cursor-not-allowed"
                : "bg-[--color-action] text-[--color-action-text] hover:bg-[--color-action-hover] shadow-sm"
            )}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Создание..." : "Создать"}
          </button>
        </div>
      </div>
    </div>
  );
}
