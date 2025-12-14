"use client";

import { Plus, Trash2 } from "lucide-react";
import { Field, Input } from "../ui/field";
import type { BlockData, AnswerItem } from "../types";

interface Props {
  block: BlockData;
  onUpdate: (updates: Partial<BlockData>) => void;
}

const genId = () => Math.random().toString(36).slice(2, 9);

export function AnswersEditor({ block, onUpdate }: Props) {
  const items = block.items || [];

  const addItem = () => {
    const newItem: AnswerItem = {
      id: genId(),
      number: String(items.length + 1),
      correctAnswers: "",
    };
    onUpdate({ items: [...items, newItem] });
  };

  const updateItem = (id: string, updates: Partial<AnswerItem>) => {
    onUpdate({
      items: items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
    });
  };

  const removeItem = (id: string) => {
    onUpdate({ items: items.filter((item) => item.id !== id) });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-[--color-text-secondary] uppercase tracking-wider">
          Ответы ({items.length})
        </span>
        <button
          onClick={addItem}
          className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-[--color-action] hover:bg-[--color-action]/10 rounded transition-colors"
        >
          <Plus size={12} />
          Добавить
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-xs text-[--color-text-secondary]/50 text-center py-4 border border-dashed border-[--color-border-main] rounded-md">
          Нет ответов
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-2 p-2 bg-[--color-bg-secondary]/50 rounded-md border border-[--color-border-main]"
            >
              <Input
                value={item.number}
                onChange={(e) => updateItem(item.id, { number: e.target.value })}
                placeholder="№"
                className="w-12 text-center"
              />
              <Input
                value={item.correctAnswers}
                onChange={(e) => updateItem(item.id, { correctAnswers: e.target.value })}
                placeholder="Правильный ответ"
                className="flex-1"
                mono
              />
              <button
                onClick={() => removeItem(item.id)}
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
