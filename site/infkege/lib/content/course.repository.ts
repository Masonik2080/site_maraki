// lib/content/course.repository.ts
// Course content repository — reads from JSON files
import 'server-only';
import fs from 'fs';
import path from 'path';
import { cacheTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { mapSbornikToCourse } from './sbornik.mapper';
import { mapDbProblemToTask } from './problem.mapper';
import type { 
  CourseDTO, 
  LessonDTO, 
  ModuleDTO, 
  SectionDTO,
  TaskDTO,
  RawSbornikJson,
  RawDbProblem 
} from './types';

// Config
const API_ROOT = process.env.LOCAL_API_PATH || path.join(process.cwd(), 'data/api');
const COURSES_DIR = path.join(API_ROOT, 'courses');

// Cache tags
const CACHE_TAG_COURSES = 'courses';
const CACHE_TAG_COURSE = 'course'; // + slug

function readCourseFile(filename: string): CourseDTO | null {
  try {
    const filePath = path.join(COURSES_DIR, filename);
    if (!fs.existsSync(filePath)) return null;
    
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(fileContent);
    
    // Sbornik format (has meta + variants)
    if (json.meta && json.variants) {
      return mapSbornikToCourse(json as RawSbornikJson, filename);
    }
    
    // Standard course format
    const flatModules: ModuleDTO[] = json.sections?.flatMap((s: SectionDTO) => s.modules) || [];
    return { ...json, modules: flatModules } as CourseDTO;
  } catch (e) {
    console.error(`[CourseRepository] Error reading ${filename}:`, e);
    return null;
  }
}

// Internal function to load courses from disk
function loadCoursesFromDisk(): CourseDTO[] {
  try {
    if (!fs.existsSync(COURSES_DIR)) return [];
    
    const files = fs.readdirSync(COURSES_DIR).filter(file => file.endsWith('.json'));
    return files
      .map(file => readCourseFile(file))
      .filter((c): c is CourseDTO => c !== null);
  } catch {
    return [];
  }
}

export async function getCourses(): Promise<CourseDTO[]> {
  'use cache';
  cacheTag(CACHE_TAG_COURSES);
  
  return loadCoursesFromDisk();
}

export async function getCourseBySlug(slug: string): Promise<CourseDTO | null> {
  'use cache';
  cacheTag(CACHE_TAG_COURSE, `course:${slug}`);
  
  // Try direct file first
  const course = readCourseFile(`${slug}.json`);
  if (course) return course;
  
  // Fallback to search in all courses
  const allCourses = loadCoursesFromDisk();
  return allCourses.find(c => c.slug === slug) ?? null;
}

export async function getLessonById(lessonId: string, courseSlug: string): Promise<LessonDTO | null> {
  'use cache';
  cacheTag(`lesson:${courseSlug}:${lessonId}`);
  
  const course = await getCourseBySlug(courseSlug);
  if (!course?.modules) return null;
  
  // Collect all modules from both sources
  const allModules = [
    ...(course.modules || []), 
    ...(course.sections?.flatMap(s => s.modules) || [])
  ];
  
  // Find lesson
  let lesson: LessonDTO | null = null;
  for (const mod of allModules) {
    const found = mod.lessons?.find(l => l.id === lessonId);
    if (found) {
      lesson = { ...found }; // Clone to avoid mutation
      break;
    }
  }
  
  if (!lesson) return null;
  
  // Enrich with problems from DB if needed
  const problemIds = lesson.contentBlocks
    .filter(b => b.type === 'task' && b.problemId)
    .map(b => b.problemId!);
  
  if (problemIds.length > 0) {
    const supabase = getSupabaseAdminClient();
    const { data: dbProblems } = await supabase
      .from('problems')
      .select('*, problem_categories ( name )')
      .in('id', problemIds);
    
    if (dbProblems) {
      const problemsMap = new Map<string, TaskDTO>();
      for (const p of dbProblems) {
        problemsMap.set(p.id, mapDbProblemToTask(p as RawDbProblem));
      }
      
      lesson.contentBlocks = lesson.contentBlocks.map(block => {
        if (block.type === 'task' && block.problemId) {
          const dbTask = problemsMap.get(block.problemId);
          if (dbTask) return { ...block, task: dbTask };
        }
        return block;
      });
    }
  }
  
  return lesson;
}

// Revalidate courses cache (for admin actions)
export async function revalidateCourses(): Promise<void> {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(CACHE_TAG_COURSES, 'max');
}

// Revalidate specific course
export async function revalidateCourse(slug: string): Promise<void> {
  const { revalidateTag } = await import('next/cache');
  revalidateTag(`course:${slug}`, 'max');
}
