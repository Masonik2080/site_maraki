// lib/data.ts
// Facade for backward compatibility — re-exports from content module
// New code should import from '@/lib/content' directly
import 'server-only';
import { cache } from 'react';
import { cacheTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { CacheTags } from './cache';

// Re-export all content types and functions
export type {
  FileDTO,
  TaskType,
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
} from './content';

export {
  getCourses,
  getCourseBySlug,
  getLessonById,
  revalidateCourses,
  revalidateCourse,
} from './content';

// ============ USER DTOs ============

export interface UserProfileDTO {
  id: string;
  userId: string;
  username: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  balance: number;
}

export interface UserOrderDTO {
  id: string;
  orderNumber: string;
  date: string;
  amount: number;
  status: string;
  items: { name: string; type: string }[];
}

// ============ USER FUNCTIONS ============
// These should eventually move to lib/dao/user.repository.ts
// Using 'use cache' for server-side caching + React cache() for request deduplication

// Request-level deduplication with React cache
const _getUserProfile = cache(async (userId: string): Promise<UserProfileDTO | null> => {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error || !data) return null;
  
  return { 
    id: data.id, 
    userId: data.user_id, 
    username: data.username, 
    fullName: data.full_name, 
    avatarUrl: data.avatar_url, 
    balance: data.balance || 0 
  };
});

export async function getUserProfile(userId: string): Promise<UserProfileDTO | null> {
  'use cache';
  cacheTag(CacheTags.USER_PROFILE(userId));
  
  return _getUserProfile(userId);
}

// Request-level deduplication
const _getUserCourses = cache(async (userId: string): Promise<import('./content').CourseDTO[]> => {
  const { getCourses } = await import('./content');
  const supabase = getSupabaseAdminClient();
  
  const { data: accessData, error } = await supabase
    .from('user_course_access')
    .select('course_id')
    .eq('user_id', userId);
  
  if (error || !accessData) return [];
  
  const allCourses = await getCourses();
  const userCourseIds = new Set(accessData.map(a => a.course_id));
  
  return allCourses.filter(course => 
    userCourseIds.has(course.id) || userCourseIds.has(course.slug)
  );
});

export async function getUserCourses(userId: string): Promise<import('./content').CourseDTO[]> {
  'use cache';
  cacheTag(CacheTags.USER_COURSES(userId));
  
  return _getUserCourses(userId);
}

// Raw DB types for order items
interface RawOrderItem {
  product_name_at_purchase: string;
  product_type: string;
  product_title?: string;
}

interface RawOrder {
  id: string;
  created_at: string;
  total_amount: number;
  status: string;
  order_items: RawOrderItem[];
}

// Request-level deduplication
const _getUserOrders = cache(async (userId: string): Promise<UserOrderDTO[]> => {
  const supabase = getSupabaseAdminClient();
  
  const { data: orders, error } = await supabase
    .from('orders')
    .select(`
      id, 
      created_at, 
      total_amount, 
      status,
      order_items ( 
        product_name_at_purchase, 
        product_type,
        product_title  
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error || !orders) {
    console.error("[getUserOrders] Supabase Error:", error);
    return [];
  }

  return (orders as RawOrder[]).map(order => {
    const items = order.order_items || [];
    
    const mappedItems = items.map(i => ({
      name: i.product_title || i.product_name_at_purchase || "Товар без названия",
      type: i.product_type || "access"
    }));

    return {
      id: order.id,
      orderNumber: order.id.split('-')[0].toUpperCase(),
      date: new Date(order.created_at).toLocaleDateString('ru-RU'),
      amount: order.total_amount,
      status: order.status,
      items: mappedItems
    };
  });
});

export async function getUserOrders(userId: string): Promise<UserOrderDTO[]> {
  'use cache';
  cacheTag(CacheTags.USER_ORDERS(userId));
  
  return _getUserOrders(userId);
}
