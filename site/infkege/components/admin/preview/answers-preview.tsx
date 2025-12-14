"use client";

import { ListChecks } from "lucide-react";
import type { AnswerItem } from "../types";

interface Props {
  title?: string;
  items?: AnswerItem[];
}

export function AnswersPreview({ title, items }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <div className="mb-8">
      {title && (
        <div className="flex items-center gap-2.5 mb-3 pb-2 border-b border-[--color-border-main]">
          <div className="bg-[--color-action]/10 p-1.5 rounded-md text-[--color-action]">
            <ListChecks size={16} />
          </div>
          <h3 className="text-sm font-semibold text-[--color-text-primary] uppercase tracking-wide">
            {title}
          </h3>
        </div>
      )}

      <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg overflow-hidden divide-y divide-[--color-border-main]">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-semibold bg-[--color-zinc-50] border border-[--color-border-main] text-[--color-text-primary]">
              {item.number}
            </div>
            <span className="text-sm font-mono text-[--color-text-secondary]">
              {item.correctAnswers || "—"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
