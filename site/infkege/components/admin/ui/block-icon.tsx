"use client";

import { Type, Video, Code, Minus, ListChecks, FileText } from "lucide-react";
import type { BlockType } from "../types";

const ICONS: Record<BlockType, React.ElementType> = {
  text: Type,
  video: Video,
  code: Code,
  divider: Minus,
  answers: ListChecks,
  files: FileText,
};

interface BlockIconProps {
  type: BlockType;
  size?: number;
}

export function BlockIcon({ type, size = 16 }: BlockIconProps) {
  const Icon = ICONS[type];
  return <Icon size={size} />;
}
