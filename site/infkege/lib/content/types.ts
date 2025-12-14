// lib/content/types.ts
// Domain types for course content

export interface FileDTO {
  name: string;
  url: string;
  size: number;
}

export type TaskType = 'choice' | 'input' | 'code';

export interface TaskChoice {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  taskType: TaskType;
  question: string;
  points: number;
  choices?: TaskChoice[];
  correctAnswer?: string;
  codeTemplates?: Record<string, string>;
  solution?: { text: string; code?: string; explanation: string };
  category?: string;
}

export interface AnswerItemDTO {
  id: string;
  number: string;
  correctAnswers: string[][];
}

export type LessonBlockType = 
  | 'video' 
  | 'text' 
  | 'files' 
  | 'pdf-viewer' 
  | 'task' 
  | 'rutube' 
  | 'divider' 
  | 'answers' 
  | 'code';

export interface LessonBlockDTO {
  type: LessonBlockType;
  title?: string;
  content?: string;
  fileUrl?: string;
  videoId?: string;
  embedUrl?: string;
  files?: FileDTO[];
  problemId?: string;
  task?: TaskDTO;
  items?: AnswerItemDTO[];
}

export interface LessonDTO {
  id: string;
  title: string;
  order: number;
  contentBlocks: LessonBlockDTO[];
}

export interface ModuleDTO {
  id: string;
  title: string;
  order?: number;
  isFree?: boolean;
  lessons: LessonDTO[];
}

export interface SectionDTO {
  id: string;
  title: string;
  order: number;
  modules: ModuleDTO[];
}

export interface PurchasePackageDTO {
  id: string;
  title: string;
  description: string;
  price: number;
}

export interface BulkPurchaseDTO {
  title: string;
  price: number;
  description: string;
  originalPrice?: number;
}

export interface PurchaseOptionsDTO {
  type: string;
  packages?: PurchasePackageDTO[];
  bulkPurchase?: BulkPurchaseDTO;
}

export interface CourseDTO {
  id: string;
  slug: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  subtitle?: string;
  iconName?: string;
  popular?: boolean;
  purchaseOptions?: PurchaseOptionsDTO;
  isPublic?: boolean;
  price: number;
  originalPrice?: number;
  features?: { text: string }[];
  sections?: SectionDTO[];
  modules?: ModuleDTO[];
}

// Raw JSON types for parsing
export interface RawMaterial {
  title?: string;
  content?: string;
  type?: string;
  url?: string;
  description?: string;
}

export interface RawResource {
  type: string;
  title: string;
  url?: string;
  description?: string;
}

export interface RawAttachment {
  filename: string;
  url: string;
}

export interface RawAnswer {
  task: number;
  value: string;
  is_multiline?: boolean;
}

export interface RawSolution {
  task_number: number;
  type: string;
  content: {
    provider?: string;
    url?: string;
    title?: string;
    snippet?: string;
  };
}

export interface RawVariant {
  id: string;
  slug?: string;
  number: number;
  title: string;
  materials?: {
    main_document?: { url: string; filename?: string };
    attachments?: RawAttachment[];
  };
  answers?: RawAnswer[];
  solutions?: RawSolution[];
}

export interface RawSbornikJson {
  meta: { id?: string; title?: string; version?: string; total_variants?: number };
  intro?: { title?: string; materials?: RawMaterial[] };
  global_resources?: RawResource[];
  variants: RawVariant[];
}

export interface RawDbProblem {
  id: string;
  internal_id?: string;
  content: string | {
    text?: string;
    question?: string;
    body?: string;
    codeTemplate?: string;
    description?: string;
    points?: number;
  };
  answer: string | {
    choices?: TaskChoice[];
    value?: string;
    correct?: string;
  };
  solution_content?: string;
  problem_categories?: { name: string };
}
