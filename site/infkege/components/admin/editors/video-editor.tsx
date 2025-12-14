"use client";

import { cn } from "@/lib/utils";
import { Field, Input } from "../ui/field";
import type { BlockData } from "../types";

interface Props {
  block: BlockData;
  onUpdate: (updates: Partial<BlockData>) => void;
}

export function VideoEditor({ block, onUpdate }: Props) {
  return (
    <Field label="Embed URL (RuTube)">
      <Input
        value={block.embedUrl || ""}
        onChange={(e) => onUpdate({ embedUrl: e.target.value })}
        placeholder="https://rutube.ru/play/embed/..."
        mono
      />
    </Field>
  );
}
