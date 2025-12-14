// components/lesson/block-renderer.tsx
import React from "react";
import dynamic from "next/dynamic";
import type { LessonBlockDTO } from "@/lib/data";

import { TextBlock } from "./blocks/text-block";
import { FileBlock } from "./blocks/file-block";
import { PdfBlock } from "./blocks/pdf-block";
import { VideoBlock } from "./blocks/video-block";
import { TaskBlock } from "./blocks/task-block";
import { AnswersBlock } from "./blocks/answers-block";

// Dynamic import for CodeBlock - react-syntax-highlighter is heavy (~200KB)
const CodeBlock = dynamic(
  () => import("./blocks/code-block").then((mod) => mod.CodeBlock),
  {
    loading: () => (
      <div className="mb-10 w-full max-w-4xl border border-border-main rounded-xl overflow-hidden bg-[#1e1e1e] h-48 animate-pulse" />
    ),
  }
);

interface BlockRendererProps {
  block: LessonBlockDTO;
  index: number; // Добавили индекс для генерации ID
}

export function BlockRenderer({ block, index }: BlockRendererProps) {
  const blockId = `block-${index}`; // Генерируем ID: block-0, block-1...

  const content = (() => {
    switch (block.type) {
      case "text":
        return <TextBlock title={block.title} content={block.content} />;
        
      case "video": 
        return <VideoBlock type="youtube" videoId={block.videoId} />;
        
      case "rutube": 
        return <VideoBlock type="rutube" url={block.embedUrl} />;
        
      case "files":
        return <FileBlock files={block.files} />;
        
      case "pdf-viewer":
        return <PdfBlock title={block.title} fileUrl={block.fileUrl} />;
        
      case "divider":
        return <hr className="my-8 border-t border-border-main/60" />;
        
      case "task":
        if (block.task) {
          return <TaskBlock task={block.task} />;
        }
        return null;

      case "answers":
        return <AnswersBlock title={block.title} items={block.items} />;

      case "code":
        return <CodeBlock title={block.title} code={block.content || ""} />;

      default:
        return null;
    }
  })();

  if (!content) return null;

  // Оборачиваем каждый блок в div с ID для навигации
  return (
    <div id={blockId} className="scroll-mt-24 relative"> 
      {/* scroll-mt-24 нужен, чтобы при скролле блок не прятался под шапкой */}
      {content}
    </div>
  );
}