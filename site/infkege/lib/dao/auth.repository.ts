// lib/dao/auth.repository.ts
// Auth operations — server-side only
import 'server-only';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { connection } from 'next/server';
import type { AuthResult, AuthUser } from './types';

export class AuthRepository {
  
  // Get current authenticated user from session
  // Note: Auth data is dynamic and should not be cached
  static async getCurrentUser(): Promise<AuthUser | null> {
    // Opt into dynamic rendering for auth checks
    await connection();
    
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) return null;
    
    return {
      id: user.id,
      email: user.email || '',
    };
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser();
    return user !== null;
  }

  // Sign out
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  }
}
