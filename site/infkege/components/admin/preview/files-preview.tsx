"use client";

import { FileText, Paperclip } from "lucide-react";
import type { FileItem } from "../types";

interface Props {
  files?: FileItem[];
}

export function FilesPreview({ files }: Props) {
  if (!files || files.length === 0) return null;

  return (
    <div className="mb-8">
      <h4 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-3 flex items-center gap-2">
        <div className="bg-amber-50 p-1.5 rounded-md text-amber-600">
          <Paperclip size={14} />
        </div>
        Прикрепленные материалы
      </h4>

      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className="flex items-center gap-3 px-3 py-2.5 bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg"
          >
            <FileText size={16} className="text-[--color-text-secondary]" />
            <span className="text-sm font-medium text-[--color-text-primary] flex-1 truncate">
              {file.name || "Без названия"}
            </span>
            {file.url && (
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[--color-action] hover:underline"
              >
                Открыть
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
