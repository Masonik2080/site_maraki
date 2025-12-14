"use client";

import { Field, Select, Textarea } from "../ui/field";
import type { BlockData } from "../types";

const LANGUAGES = [
  { value: "python", label: "Python" },
  { value: "javascript", label: "JavaScript" },
  { value: "typescript", label: "TypeScript" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "sql", label: "SQL" },
];

interface Props {
  block: BlockData;
  onUpdate: (updates: Partial<BlockData>) => void;
}

export function CodeEditor({ block, onUpdate }: Props) {
  return (
    <div className="space-y-3">
      <Field label="Язык">
        <Select
          value={block.language || "python"}
          onChange={(e) => onUpdate({ language: e.target.value })}
          options={LANGUAGES}
        />
      </Field>

      <Field label="Код">
        <Textarea
          value={block.content || ""}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="# Введите код..."
          rows={8}
          mono
          dark
        />
      </Field>
    </div>
  );
}
