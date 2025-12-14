"use client";

import { Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockData } from "./types";
import { BlockCard } from "./block-card";
import { BlockPreview } from "./preview";

interface EditorCanvasProps {
  blocks: BlockData[];
  draggedId: string | null;
  showPreview: boolean;
  onUpdate: (id: string, updates: Partial<BlockData>) => void;
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragOver: (targetId: string) => void;
  onDragEnd: () => void;
}

export function EditorCanvas({
  blocks,
  draggedId,
  showPreview,
  onUpdate,
  onRemove,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd,
}: EditorCanvasProps) {
  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Editor Panel */}
      <div className={cn("flex-1 overflow-y-auto p-6", showPreview && "border-r border-[--color-border-main]")}>
        <div className="max-w-2xl mx-auto space-y-3">
          {blocks.length === 0 && (
            <div className="text-center py-16 text-[--color-text-secondary]">
              <Layers size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Добавьте первый блок</p>
            </div>
          )}

          {blocks.map((block, idx) => (
            <BlockCard
              key={block.id}
              block={block}
              index={idx}
              isDragging={draggedId === block.id}
              onUpdate={(updates) => onUpdate(block.id, updates)}
              onRemove={() => onRemove(block.id)}
              onDuplicate={() => onDuplicate(block.id)}
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = "move";
                onDragStart(block.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                onDragOver(block.id);
              }}
              onDragEnd={onDragEnd}
            />
          ))}
        </div>
      </div>

      {/* Preview Panel */}
      {showPreview && (
        <div className="w-1/2 overflow-y-auto p-6 bg-[--color-bg-secondary]/30">
          <div className="max-w-2xl mx-auto">
            <div className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-4">
              Предпросмотр
            </div>
            {blocks.map((block) => (
              <BlockPreview key={block.id} block={block} />
            ))}
            {blocks.length === 0 && (
              <div className="text-center py-16 text-[--color-text-secondary]/50 text-sm">
                Пусто
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
