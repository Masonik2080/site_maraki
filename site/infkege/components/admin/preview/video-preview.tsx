"use client";

interface Props {
  type: "youtube" | "rutube";
  videoId?: string;
  embedUrl?: string;
}

export function VideoPreview({ type, videoId, embedUrl }: Props) {
  const src = embedUrl;

  if (!src) {
    return (
      <div className="w-full aspect-video bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg flex items-center justify-center text-[--color-text-secondary] text-sm mb-8">
        Укажите RuTube URL
      </div>
    );
  }

  return (
    <div className="w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-[--color-border-main] shadow-sm mb-8">
      <iframe
        width="100%"
        height="100%"
        src={src}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
