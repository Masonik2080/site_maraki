import React from "react";

interface VideoBlockProps {
  type: 'youtube' | 'rutube';
  url?: string;     // для RuTube (embedUrl)
  videoId?: string; // для YouTube
}

export function VideoBlock({ type, url, videoId }: VideoBlockProps) {
  // Формируем финальный URL для iframe
  let src = "";
  
  if (type === 'rutube' && url) {
    src = url;
  } else if (type === 'youtube' && videoId) {
    src = `https://www.youtube.com/embed/${videoId}`;
  }

  if (!src) return null;

  return (
    <div className="w-full aspect-video bg-zinc-900 rounded-lg overflow-hidden border border-border-main shadow-sm mb-10">
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