// lib/dao/admin.guard.ts
// Централизованная проверка прав администратора — server-side only
// Следуем паттерну Data Access Layer (DAL) из Next.js 16
import 'server-only';
import { cache } from 'react';
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export interface AdminCheckResult {
  isAdmin: boolean;
  userId?: string;
  error?: NextResponse;
}

/**
 * Проверяет, является ли текущий пользователь администратором.
 * Использует React cache для мемоизации в рамках одного запроса.
 * 
 * @returns Promise<AdminCheckResult>
 * 
 * Использование в API Route:
 * ```ts
 * const { isAdmin, error } = await checkAdminAccess();
 * if (!isAdmin) return error!;
 * ```
 */
export const checkAdminAccess = cache(async (): Promise<AdminCheckResult> => {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { 
      isAdmin: false, 
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { 
      isAdmin: false, 
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) 
    };
  }

  return { isAdmin: true, userId: user.id };
});

/**
 * Проверяет авторизацию и возвращает userId.
 * Для использования в не-admin эндпоинтах.
 */
export const requireAuth = cache(async (): Promise<{ userId: string } | { error: NextResponse }> => {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { 
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) 
    };
  }

  return { userId: user.id };
});
