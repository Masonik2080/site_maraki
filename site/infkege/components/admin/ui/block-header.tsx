"use client";

import { GripVertical, ChevronDown, ChevronUp, Copy, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockType } from "../types";
import { BLOCK_META } from "../types";
import { BlockIcon } from "../ui/block-icon";

interface BlockHeaderProps {
  type: BlockType;
  index: number;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}

export function BlockHeader({
  type,
  index,
  collapsed,
  onToggleCollapse,
  onDuplicate,
  onRemove,
}: BlockHeaderProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-[--color-bg-secondary]/50 border-b border-[--color-border-main]">
      <div
        className="cursor-grab active:cursor-grabbing p-1 text-[--color-text-secondary]/50 hover:text-[--color-text-secondary]"
        title="Перетащить"
      >
        <GripVertical size={14} />
      </div>

      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="p-1 rounded bg-[--color-action]/10 text-[--color-action]">
          <BlockIcon type={type} size={12} />
        </div>
        <span className="text-xs font-medium text-[--color-text-secondary] uppercase tracking-wide">
          {BLOCK_META[type].label}
        </span>
        <span className="text-[10px] text-[--color-text-secondary]/40">#{index + 1}</span>
      </div>

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton onClick={onToggleCollapse} title={collapsed ? "Развернуть" : "Свернуть"}>
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </IconButton>
        <IconButton onClick={onDuplicate} title="Дублировать">
          <Copy size={14} />
        </IconButton>
        <IconButton onClick={onRemove} title="Удалить" danger>
          <Trash2 size={14} />
        </IconButton>
      </div>
    </div>
  );
}

function IconButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        "p-1 rounded transition-colors",
        danger
          ? "text-[--color-text-secondary] hover:text-red-500"
          : "text-[--color-text-secondary] hover:text-[--color-text-primary]"
      )}
    >
      {children}
    </button>
  );
}
