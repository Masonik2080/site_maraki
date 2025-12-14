"use client";

import React, { useState, useMemo } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  title?: string;
  language?: string;
  code: string;
}

/**
 * Функция для "красивой" нормализации кода.
 * Убирает лишние отступы слева (если код был скопирован с отступом)
 * и удаляет пустые строки по краям.
 */
function normalizeCode(rawCode: string): string {
  if (!rawCode) return "";

  // 1. Разбиваем на строки
  const lines = rawCode.split("\n");

  // 2. Удаляем пустые строки с начала и конца массива
  while (lines.length > 0 && lines[0].trim() === "") {
    lines.shift();
  }
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") {
    lines.pop();
  }

  // Если код пустой после тримма
  if (lines.length === 0) return "";

  // 3. Ищем минимальный общий отступ
  let minIndent = Infinity;
  for (const line of lines) {
    // Пропускаем пустые строки внутри кода, они не влияют на отступ
    if (line.trim().length === 0) continue;
    
    // Считаем количество пробелов в начале строки
    const match = line.match(/^ */);
    const indent = match ? match[0].length : 0;
    
    if (indent < minIndent) {
      minIndent = indent;
    }
  }

  // Если минимальный отступ найден и он больше 0, обрезаем его у каждой строки
  if (minIndent !== Infinity && minIndent > 0) {
    return lines
      .map((line) => (line.length >= minIndent ? line.slice(minIndent) : line))
      .join("\n");
  }

  return lines.join("\n");
}

export function CodeBlock({ title, language = "python", code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  // Используем useMemo, чтобы форматирование срабатывало только при изменении кода
  const formattedCode = useMemo(() => normalizeCode(code), [code]);

  const onCopy = () => {
    navigator.clipboard.writeText(formattedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lang = language.toLowerCase();

  return (
    <div className="mb-10 w-full max-w-4xl border border-border-main rounded-xl overflow-hidden shadow-sm bg-[#1e1e1e]">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#252526]">
        <div className="flex items-center gap-2.5">
          <div className="text-zinc-400">
            <Terminal size={15} />
          </div>
          <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider">
             {title || lang}
          </span>
        </div>

        <button
          onClick={onCopy}
          className="flex items-center gap-1.5 px-2 py-1 -mr-2 rounded-md hover:bg-white/10 transition-colors text-xs font-medium text-zinc-400 hover:text-white"
          title="Скопировать код"
        >
          {copied ? (
            <>
              <Check size={14} className="text-emerald-500" />
              <span className="text-emerald-500">Скопировано</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Копировать</span>
            </>
          )}
        </button>
      </div>

      {/* --- CODE AREA --- */}
      <div className="relative text-sm">
        <SyntaxHighlighter
          language={lang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1.5rem",
            background: "transparent",
            fontSize: "14px",
            lineHeight: "1.6",
          }}
          wrapLongLines={true}
          showLineNumbers={true}
          lineNumberStyle={{
            minWidth: "2.5em", 
            paddingRight: "1em", 
            color: "#6e7681", 
            textAlign: "right",
            userSelect: "none" // Чтобы номера строк не выделялись мышкой
          }}
        >
          {formattedCode}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}