// lib/dao/access.repository.ts
// Course access operations — server-side only with caching
import 'server-only';
import { cache } from 'react';
import { cacheTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { connection } from 'next/server';
import type { CourseAccess } from './types';

export class AccessRepository {
  
  // Check if user has access to course
  // Note: Access checks are dynamic per-user
  static async hasAccess(userId: string, courseId: string): Promise<boolean> {
    // Opt into dynamic rendering for access checks
    await connection();
    
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('user_course_access')
      .select('id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .limit(1);
    
    return !error && data !== null && data.length > 0;
  }

  // Check if user has access to specific package
  static async hasPackageAccess(userId: string, packageId: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('user_course_access')
      .select('id')
      .eq('user_id', userId)
      .eq('package_id', packageId)
      .maybeSingle();
    
    return !error && data !== null;
  }

  // Get all user course accesses
  static async getUserAccesses(userId: string): Promise<CourseAccess[]> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('user_course_access')
      .select('*')
      .eq('user_id', userId);
    
    if (error || !data) return [];
    
    return data.map(this.mapToAccess);
  }

  // Get user's accessible course IDs
  // Кэширование отключено — данные о доступе должны быть актуальными
  static async getUserCourseIds(userId: string): Promise<string[]> {
    const accesses = await AccessRepository.getUserAccesses(userId);
    return [...new Set(accesses.map(a => a.courseId))];
  }

  // Grant access to course
  static async grantAccess(
    userId: string, 
    courseId: string, 
    packageId?: string,
    productTitle?: string
  ): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const { error } = await supabase
      .from('user_course_access')
      .insert({
        user_id: userId,
        course_id: courseId,
        package_id: packageId,
        product_title: productTitle,
      });
    
    // Cache invalidation handled by Next.js automatically via cacheTag
    return !error;
  }

  // Revoke access
  static async revokeAccess(userId: string, courseId: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const { error } = await supabase
      .from('user_course_access')
      .delete()
      .eq('user_id', userId)
      .eq('course_id', courseId);
    
    // Cache invalidation handled by Next.js automatically via cacheTag
    return !error;
  }
  
  // Grant access and invalidate cache
  static async grantAccessWithInvalidation(
    userId: string, 
    courseId: string, 
    packageId?: string,
    productTitle?: string
  ): Promise<boolean> {
    return this.grantAccess(userId, courseId, packageId, productTitle);
  }

  // Get user's package IDs for a course
  static async getUserPackagesForCourse(userId: string, courseId: string): Promise<string[]> {
    await connection();
    
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('user_course_access')
      .select('package_id')
      .eq('user_id', userId)
      .eq('course_id', courseId);
    
    if (error || !data) return [];
    
    // Если есть запись без package_id — полный доступ
    // Иначе возвращаем список пакетов
    const packages = data.map(d => d.package_id).filter(Boolean) as string[];
    const hasFullAccess = data.some(d => d.package_id === null);
    
    return hasFullAccess ? ['full'] : packages;
  }

  // Check if user has access to specific variant by number
  // Использует конфигурацию из lib/config/packages.config.ts
  static async hasVariantAccess(
    userId: string, 
    courseId: string, 
    variantNumber: number
  ): Promise<boolean> {
    const { hasVariantAccess: checkAccess } = await import('@/lib/config/packages.config');
    const packages = await this.getUserPackagesForCourse(userId, courseId);
    return checkAccess(courseId, variantNumber, packages);
  }

  // Private mapper
  private static mapToAccess(data: any): CourseAccess {
    return {
      userId: data.user_id,
      courseId: data.course_id,
      packageId: data.package_id,
      grantedAt: new Date(data.granted_at),
    };
  }
}
