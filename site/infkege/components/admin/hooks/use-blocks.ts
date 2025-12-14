"use client";

import { useState, useCallback } from "react";
import type { BlockData, BlockType } from "../types";

const genId = () => Math.random().toString(36).slice(2, 9);

const createBlock = (type: BlockType): BlockData => {
  const base: BlockData = { id: genId(), type, title: "", content: "", collapsed: false };
  
  switch (type) {
    case "answers":
      return { ...base, items: [] };
    case "files":
      return { ...base, files: [] };
    case "video":
      return { ...base, videoType: "rutube", embedUrl: "" };
    case "code":
      return { ...base, language: "python" };
    default:
      return base;
  }
};

export function useBlocks(initial: BlockData[] = []) {
  const [blocks, setBlocks] = useState<BlockData[]>(initial);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const add = useCallback((type: BlockType) => {
    setBlocks((prev) => [...prev, createBlock(type)]);
  }, []);

  const remove = useCallback((id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const update = useCallback((id: string, updates: Partial<BlockData>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...updates } : b)));
  }, []);

  const duplicate = useCallback((id: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      const copy = { ...prev[idx], id: genId() };
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  const move = useCallback((fromIdx: number, toIdx: number) => {
    setBlocks((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }, []);

  const startDrag = useCallback((id: string) => setDraggedId(id), []);
  const endDrag = useCallback(() => setDraggedId(null), []);

  const handleDragOver = useCallback(
    (targetId: string) => {
      if (!draggedId || draggedId === targetId) return;
      const fromIdx = blocks.findIndex((b) => b.id === draggedId);
      const toIdx = blocks.findIndex((b) => b.id === targetId);
      if (fromIdx !== toIdx) move(fromIdx, toIdx);
    },
    [draggedId, blocks, move]
  );

  const exportJSON = useCallback(() => {
    return JSON.stringify(blocks, null, 2);
  }, [blocks]);

  return {
    blocks,
    draggedId,
    add,
    remove,
    update,
    duplicate,
    startDrag,
    endDrag,
    handleDragOver,
    exportJSON,
  };
}
