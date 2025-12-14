"use client";

import { cn } from "@/lib/utils";
import type { BlockType, BlockData } from "./types";
import { BLOCK_META } from "./types";
import { BlockIcon } from "./ui/block-icon";

const BLOCK_TYPES: BlockType[] = ["text", "video", "code", "divider", "answers", "files"];

interface SidebarProps {
  open: boolean;
  blocks: BlockData[];
  onAddBlock: (type: BlockType) => void;
}

export function Sidebar({ open, blocks, onAddBlock }: SidebarProps) {
  return (
    <aside
      className={cn(
        "border-r border-[--color-border-main] bg-[--color-bg-secondary] transition-all duration-300 flex flex-col",
        open ? "w-56" : "w-0 overflow-hidden"
      )}
    >
      {/* Add Block */}
      <div className="p-4 border-b border-[--color-border-main]">
        <h2 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-3">
          Добавить блок
        </h2>
        <div className="grid grid-cols-2 gap-1.5">
          {BLOCK_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => onAddBlock(type)}
              className="flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-page-bg] rounded-md transition-all border border-transparent hover:border-[--color-border-main]"
            >
              <BlockIcon type={type} size={14} />
              {BLOCK_META[type].label}
            </button>
          ))}
        </div>
      </div>

      {/* Structure */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-3">
          Структура
        </h2>
        <div className="space-y-1">
          {blocks.map((block, idx) => (
            <div
              key={block.id}
              className="flex items-center gap-2 px-2 py-1.5 text-xs text-[--color-text-secondary] rounded hover:bg-[--color-page-bg] cursor-pointer"
            >
              <span className="text-[10px] text-[--color-text-secondary]/50 w-4">{idx + 1}</span>
              <BlockIcon type={block.type} size={12} />
              <span className="truncate flex-1">{block.title || BLOCK_META[block.type].label}</span>
            </div>
          ))}
          {blocks.length === 0 && (
            <div className="text-xs text-[--color-text-secondary]/50 text-center py-4">
              Пусто
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
