"use client";

interface Props {
  title?: string;
  content?: string;
}

export function TextPreview({ title, content }: Props) {
  if (!content) return null;

  return (
    <div className="mb-8">
      {title && (
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-5 bg-[--color-action] rounded-full" />
          <h3 className="text-base font-bold text-[--color-text-primary] uppercase tracking-tight">
            {title}
          </h3>
        </div>
      )}
      <div
        className="prose prose-zinc max-w-none text-[--color-text-primary]/90 leading-7 text-[15px]"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  );
}
