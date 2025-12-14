import React from "react";
import { Paperclip } from "lucide-react";
import type { FileDTO } from "@/lib/data";
import { SmartFileItem } from "./smart-file-item";

interface FileBlockProps {
  files?: FileDTO[];
}

export function FileBlock({ files }: FileBlockProps) {
  if (!files || files.length === 0) return null;

  return (
    <div className="mb-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4 flex items-center gap-2 px-1">
        <div className="bg-amber-50 p-1.5 rounded-md text-amber-600">
           <Paperclip size={16} />
        </div>
        Прикрепленные материалы
      </h4>
      
      <div className="grid gap-4">
        {files.map((file, idx) => (
          <SmartFileItem key={idx} file={file} />
        ))}
      </div>
    </div>
  );
}