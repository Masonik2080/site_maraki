// lib/content/index.ts
// Course content module exports

// Types
export type {
  FileDTO,
  TaskType,
  TaskChoice,
  TaskDTO,
  AnswerItemDTO,
  LessonBlockType,
  LessonBlockDTO,
  LessonDTO,
  ModuleDTO,
  SectionDTO,
  PurchasePackageDTO,
  BulkPurchaseDTO,
  PurchaseOptionsDTO,
  CourseDTO,
} from './types';

// Repository functions
export {
  getCourses,
  getCourseBySlug,
  getLessonById,
  revalidateCourses,
  revalidateCourse,
} from './course.repository';

// Mappers (for advanced use)
export { mapSbornikToCourse } from './sbornik.mapper';
export { mapDbProblemToTask } from './problem.mapper';
