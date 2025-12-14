"use client";

import { use, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, Save, Loader2, AlertCircle, Check } from "lucide-react";
import { useLesson } from "@/components/admin/hooks/use-lesson";
import { Sidebar, EditorCanvas } from "@/components/admin";
import { useEditorUI } from "@/components/admin/hooks/use-editor-ui";
import type { BlockData, BlockType } from "@/components/admin/types";

const genId = () => Math.random().toString(36).slice(2, 9);

export default function LessonEditorPage({
  params,
}: {
  params: Promise<{ slug: string; lessonId: string }>;
}) {
  const { slug, lessonId } = use(params);
  const { lesson, blocks, setBlocks, loading, saving, error, save } = useLesson(slug, lessonId);
  const { showPreview, sidebarOpen, togglePreview, toggleSidebar } = useEditorUI();

  // Block operations
  const addBlock = useCallback((type: BlockType) => {
    const newBlock: BlockData = {
      id: genId(),
      type,
      title: "",
      content: "",
      collapsed: false,
    };
    if (type === "answers") newBlock.items = [];
    if (type === "files") newBlock.files = [];
    if (type === "video") {
      newBlock.videoType = "youtube";
      newBlock.videoId = "";
    }
    if (type === "code") newBlock.language = "python";
    setBlocks((prev) => [...prev, newBlock]);
  }, [setBlocks]);

  const updateBlock = useCallback((id: string, updates: Partial<BlockData>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, [setBlocks]);

  const removeBlock = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, [setBlocks]);

  const duplicateBlock = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: genId() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, [setBlocks]);

  // Drag state (simplified)
  const handleDragStart = useCallback(() => {}, []);
  const handleDragOver = useCallback(() => {}, []);
  const handleDragEnd = useCallback(() => {}, []);

  const handleSave = async () => {
    const success = await save();
    if (success) {
      // Could show toast
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[--color-text-secondary]">
        <Loader2 size={20} className="animate-spin mr-2" />
        Загрузка урока...
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-500">
        <AlertCircle size={20} className="mr-2" />
        {error || "Урок не найден"}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="h-12 px-4 flex items-center gap-3 border-b border-[--color-border-main] bg-[--color-page-bg]">
        <Link
          href={`/admin/courses/${slug}`}
          className="p-1 text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
        >
          <ChevronLeft size={18} />
        </Link>

        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-[--color-text-primary] truncate">
            {lesson.title}
          </h1>
          <p className="text-[10px] text-[--color-text-secondary]">
            {blocks.length} блоков
          </p>
        </div>

        <button
          onClick={togglePreview}
          className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-all ${
            showPreview
              ? "bg-[--color-action]/10 border-[--color-action]/30 text-[--color-action]"
              : "border-[--color-border-main] text-[--color-text-secondary]"
          }`}
        >
          Превью
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[--color-action] text-[--color-action-text] hover:bg-[--color-action-hover] transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}
          Сохранить
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar open={sidebarOpen} blocks={blocks} onAddBlock={addBlock} />

        <EditorCanvas
          blocks={blocks}
          draggedId={null}
          showPreview={showPreview}
          onUpdate={updateBlock}
          onRemove={removeBlock}
          onDuplicate={duplicateBlock}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        />
      </div>
    </div>
  );
}
