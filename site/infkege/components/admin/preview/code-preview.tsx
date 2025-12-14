"use client";

import { Terminal } from "lucide-react";

interface Props {
  title?: string;
  code: string;
  language?: string;
}

export function CodePreview({ title, code, language = "python" }: Props) {
  if (!code) return null;

  return (
    <div className="mb-8 border border-[--color-border-main] rounded-lg overflow-hidden bg-[#1e1e1e]">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/10 bg-[#252526]">
        <Terminal size={14} className="text-zinc-400" />
        <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
          {title || language}
        </span>
      </div>
      <pre className="p-4 text-sm font-mono text-zinc-100 overflow-x-auto leading-relaxed">
        {code}
      </pre>
    </div>
  );
}
