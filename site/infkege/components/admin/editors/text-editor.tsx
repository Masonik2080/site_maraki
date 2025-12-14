"use client";

import { Field, Textarea } from "../ui/field";
import type { BlockData } from "../types";

interface Props {
  block: BlockData;
  onUpdate: (updates: Partial<BlockData>) => void;
}

export function TextEditor({ block, onUpdate }: Props) {
  return (
    <Field label="Содержимое (HTML)">
      <Textarea
        value={block.content || ""}
        onChange={(e) => onUpdate({ content: e.target.value })}
        placeholder="<p>Введите текст...</p>"
        rows={6}
        mono
      />
    </Field>
  );
}
