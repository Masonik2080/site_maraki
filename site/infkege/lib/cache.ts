// lib/cache.ts
// Centralized cache utilities with 'use cache' directive support
import 'server-only';
import { cache } from 'react';
import { cacheTag, cacheLife } from 'next/cache';

// ============ CACHE PROFILES ============
// Predefined cache durations for different data types

export const CacheProfiles = {
  // Static content - rarely changes
  STATIC: 'max', // 1 year
  
  // Course content - changes occasionally
  COURSES: 'days', // 1 day
  
  // User data - changes frequently
  USER: 'minutes', // 5 minutes
  
  // Real-time data - very short cache
  REALTIME: 'seconds', // 1 minute
} as const;

// ============ REACT CACHE WRAPPERS ============
// Use React's cache() for request-level deduplication

/**
 * Deduplicate function calls within a single request
 * Use this for expensive operations that might be called multiple times
 */
export function dedupe<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return cache(fn) as T;
}

// ============ CACHE TAGS ============
// Centralized tag definitions for consistency

export const CacheTags = {
  // Courses
  COURSES: 'courses',
  COURSE: (slug: string) => `course:${slug}`,
  LESSON: (courseSlug: string, lessonId: string) => `lesson:${courseSlug}:${lessonId}`,
  
  // Products
  PRODUCTS: 'products',
  PRODUCT: (id: string) => `product:${id}`,
  
  // Users
  USER: (id: string) => `user:${id}`,
  USER_PROFILE: (id: string) => `user-profile:${id}`,
  USER_COURSES: (id: string) => `user-courses:${id}`,
  USER_ORDERS: (id: string) => `user-orders:${id}`,
  
  // Cart
  CART: (userId: string) => `cart:${userId}`,
  
  // Payment links
  PAYMENT_LINKS: 'payment-links',
  PAYMENT_LINK: (id: string) => `payment-link:${id}`,
  
  // Settings
  SITE_SETTINGS: 'site-settings',
  BRANDING: 'branding',
} as const;

// ============ REVALIDATION HELPERS ============

export { revalidateTag, revalidatePath } from 'next/cache';

// For Server Actions - immediate invalidation
export { updateTag } from 'next/cache';
