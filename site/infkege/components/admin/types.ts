// Типы для админки редактора блоков

export type BlockType = "text" | "video" | "code" | "divider" | "answers" | "files";

export interface AnswerItem {
  id: string;
  number: string;
  correctAnswers: string;
}

export interface FileItem {
  id: string;
  name: string;
  url: string;
}

export interface BlockData {
  id: string;
  type: BlockType;
  title?: string;
  content?: string;
  videoId?: string;
  videoType?: "youtube" | "rutube";
  embedUrl?: string;
  language?: string;
  items?: AnswerItem[];
  files?: FileItem[];
  collapsed?: boolean;
}

export interface BlockMeta {
  type: BlockType;
  label: string;
  icon: string;
}

export const BLOCK_META: Record<BlockType, { label: string }> = {
  text: { label: "Текст" },
  video: { label: "Видео (RuTube)" },
  code: { label: "Код" },
  divider: { label: "Разделитель" },
  answers: { label: "Ответы" },
  files: { label: "Файлы" },
};
