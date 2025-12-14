"use client";

import { cn } from "@/lib/utils";
import type { BlockData } from "./types";
import { BlockHeader } from "./ui/block-header";
import { Field, Input } from "./ui/field";
import { TextEditor, VideoEditor, CodeEditor, AnswersEditor, FilesEditor } from "./editors";

interface BlockCardProps {
  block: BlockData;
  index: number;
  isDragging: boolean;
  onUpdate: (updates: Partial<BlockData>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export function BlockCard({
  block,
  index,
  isDragging,
  onUpdate,
  onRemove,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd,
}: BlockCardProps) {
  const renderEditor = () => {
    switch (block.type) {
      case "text":
        return <TextEditor block={block} onUpdate={onUpdate} />;
      case "video":
        return <VideoEditor block={block} onUpdate={onUpdate} />;
      case "code":
        return <CodeEditor block={block} onUpdate={onUpdate} />;
      case "answers":
        return <AnswersEditor block={block} onUpdate={onUpdate} />;
      case "files":
        return <FilesEditor block={block} onUpdate={onUpdate} />;
      case "divider":
        return (
          <div className="text-xs text-[--color-text-secondary]/50 text-center py-2">
            Горизонтальный разделитель
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      className={cn(
        "group bg-[--color-page-bg] border border-[--color-border-main] rounded-lg overflow-hidden transition-all",
        isDragging && "opacity-50 scale-[0.98]",
        "hover:border-[--color-action]/30"
      )}
    >
      <BlockHeader
        type={block.type}
        index={index}
        collapsed={!!block.collapsed}
        onToggleCollapse={() => onUpdate({ collapsed: !block.collapsed })}
        onDuplicate={onDuplicate}
        onRemove={onRemove}
      />

      {!block.collapsed && (
        <div className="p-3 space-y-3">
          {block.type !== "divider" && (
            <Field label="Заголовок">
              <Input
                value={block.title || ""}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Без заголовка"
              />
            </Field>
          )}
          {renderEditor()}
        </div>
      )}
    </div>
  );
}
