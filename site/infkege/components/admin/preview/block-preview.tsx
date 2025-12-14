"use client";

import type { BlockData } from "../types";
import { TextPreview } from "./text-preview";
import { VideoPreview } from "./video-preview";
import { CodePreview } from "./code-preview";
import { AnswersPreview } from "./answers-preview";
import { FilesPreview } from "./files-preview";

interface BlockPreviewProps {
  block: BlockData;
}

export function BlockPreview({ block }: BlockPreviewProps) {
  switch (block.type) {
    case "text":
      return <TextPreview title={block.title} content={block.content} />;
    case "video":
      return (
        <VideoPreview
          type={block.videoType || "youtube"}
          videoId={block.videoId}
          embedUrl={block.embedUrl}
        />
      );
    case "code":
      return <CodePreview title={block.title} code={block.content || ""} language={block.language} />;
    case "answers":
      return <AnswersPreview title={block.title} items={block.items} />;
    case "files":
      return <FilesPreview files={block.files} />;
    case "divider":
      return <hr className="my-8 border-t border-[--color-border-main]/60" />;
    default:
      return null;
  }
}
