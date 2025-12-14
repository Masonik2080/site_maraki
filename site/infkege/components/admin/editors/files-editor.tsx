"use client";

import { Plus, Trash2 } from "lucide-react";
import { Input } from "../ui/field";
import type { BlockData, FileItem } from "../types";

interface Props {
  block: BlockData;
  onUpdate: (updates: Partial<BlockData>) => void;
}

const genId = () => Math.random().toString(36).slice(2, 9);

export function FilesEditor({ block, onUpdate }: Props) {
  const files = block.files || [];

  const addFile = () => {
    const newFile: FileItem = { id: genId(), name: "", url: "" };
    onUpdate({ files: [...files, newFile] });
  };

  const updateFile = (id: string, updates: Partial<FileItem>) => {
    onUpdate({
      files: files.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    });
  };

  const removeFile = (id: string) => {
    onUpdate({ files: files.filter((f) => f.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[--color-text-secondary] uppercase tracking-wider">
          Файлы ({files.length})
        </span>
        <button
          onClick={addFile}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[--color-action] hover:bg-[--color-action]/10 rounded transition-colors"
        >
          <Plus size={12} />
          Добавить
        </button>
      </div>

      {files.length === 0 ? (
        <div className="text-xs text-[--color-text-secondary]/50 text-center py-4 border border-dashed border-[--color-border-main] rounded-md">
          Нет файлов
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 bg-[--color-bg-secondary]/50 rounded-md border border-[--color-border-main]"
            >
              <Input
                value={file.name}
                onChange={(e) => updateFile(file.id, { name: e.target.value })}
                placeholder="Название файла"
                className="flex-1"
              />
              <Input
                value={file.url}
                onChange={(e) => updateFile(file.id, { url: e.target.value })}
                placeholder="URL"
                className="flex-1"
                mono
              />
              <button
                onClick={() => removeFile(file.id)}
                className="p-1.5 text-[--color-text-secondary] hover:text-red-500 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
