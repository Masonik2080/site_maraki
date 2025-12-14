"use client";

import { useState, useEffect, useCallback } from "react";
import type { LessonDTO, LessonBlockDTO } from "@/lib/data";
import type { BlockData } from "../types";

// Конвертация из LessonBlockDTO в BlockData для редактора
function toEditorBlock(block: LessonBlockDTO, idx: number): BlockData {
  const base: BlockData = {
    id: `block-${idx}-${Date.now()}`,
    type: block.type === "rutube" ? "video" : block.type as any,
    title: block.title,
    content: block.content,
    collapsed: false,
  };

  if (block.type === "video" || block.type === "rutube") {
    base.videoType = "rutube";
    base.embedUrl = block.embedUrl;
  } else if (block.type === "answers" && block.items) {
    base.items = block.items.map((item) => ({
      id: item.id,
      number: item.number,
      correctAnswers: item.correctAnswers.flat().join(", "),
    }));
  } else if (block.type === "files" && block.files) {
    base.files = block.files.map((f, i) => ({
      id: `file-${i}`,
      name: f.name,
      url: f.url,
    }));
  }

  return base;
}

// Конвертация обратно из BlockData в LessonBlockDTO
function toLessonBlock(block: BlockData): LessonBlockDTO {
  const base: LessonBlockDTO = {
    type: block.type === "video" && block.videoType === "rutube" ? "rutube" : block.type as any,
    title: block.title,
    content: block.content,
  };

  if (block.type === "video") {
    base.type = "rutube";
    base.embedUrl = block.embedUrl;
  } else if (block.type === "answers" && block.items) {
    base.items = block.items.map((item) => ({
      id: item.id,
      number: item.number,
      correctAnswers: item.correctAnswers.split(",").map((s) => [s.trim()]),
    }));
  } else if (block.type === "files" && block.files) {
    base.files = block.files.map((f) => ({
      name: f.name,
      url: f.url,
      size: 0,
    }));
  }

  return base;
}

export function useLesson(slug: string, lessonId: string) {
  const [lesson, setLesson] = useState<LessonDTO | null>(null);
  const [blocks, setBlocks] = useState<BlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Загрузка урока
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/courses/${slug}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const course = await res.json();

        // Ищем урок
        let foundLesson: LessonDTO | null = null;
        for (const mod of course.modules || []) {
          const l = mod.lessons?.find((l: LessonDTO) => l.id === lessonId);
          if (l) {
            foundLesson = l;
            break;
          }
        }

        if (!foundLesson) throw new Error("Lesson not found");

        setLesson(foundLesson);
        setBlocks((foundLesson.contentBlocks || []).map(toEditorBlock));
        setError(null);
      } catch (e) {
        setError("Не удалось загрузить урок");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, lessonId]);

  // Сохранение
  const save = useCallback(async () => {
    try {
      setSaving(true);
      const contentBlocks = blocks.map(toLessonBlock);
      const res = await fetch(`/api/admin/courses/${slug}/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentBlocks }),
      });
      if (!res.ok) throw new Error("Failed to save");
      return true;
    } catch (e) {
      return false;
    } finally {
      setSaving(false);
    }
  }, [slug, lessonId, blocks]);

  return {
    lesson,
    blocks,
    setBlocks,
    loading,
    saving,
    error,
    save,
  };
}
