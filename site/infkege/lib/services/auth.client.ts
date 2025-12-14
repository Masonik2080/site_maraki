// lib/services/auth.client.ts
// Client-side auth service — uses API routes
'use client';

import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface AuthResponse {
  success: boolean;
  error?: string;
  needsConfirmation?: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName?: string | null;
}

export class AuthClientService {
  
  // Get current user from browser session
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) return null;
      
      return {
        id: user.id,
        email: user.email || '',
        fullName: user.user_metadata?.full_name || null,
      };
    } catch {
      return null;
    }
  }

  // Subscribe to auth state changes
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const supabase = getSupabaseBrowserClient();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          callback({
            id: session.user.id,
            email: session.user.email || '',
            fullName: session.user.user_metadata?.full_name || null,
          });
        } else {
          callback(null);
        }
      }
    );
    
    return () => subscription.unsubscribe();
  }

  // Login with email/password (через API route с проверкой капчи)
  static async login(email: string, password: string, captchaToken?: string): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, captchaToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Ошибка входа' };
      }

      // После успешного входа через API, обновляем сессию в браузере
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signInWithPassword({ email, password });

      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  }

  // Register new user (через API route с проверкой капчи)
  static async register(
    email: string, 
    password: string, 
    fullName?: string,
    captchaToken?: string
  ): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName, captchaToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        return { success: false, error: result.error || 'Ошибка регистрации' };
      }

      // Если не требуется подтверждение email, логиним пользователя
      if (!result.needsConfirmation) {
        const supabase = getSupabaseBrowserClient();
        await supabase.auth.signInWithPassword({ email, password });
      }

      return { 
        success: true, 
        needsConfirmation: result.needsConfirmation 
      };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  }

  // Logout
  static async logout(): Promise<AuthResponse> {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { success: false, error: 'Ошибка выхода' };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  }

  // Login with Google
  static async loginWithGoogle(redirectTo?: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
      },
    });
  }

  // Login with VK
  static async loginWithVK(redirectTo?: string): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    
    // VK OAuth if configured in Supabase
    await supabase.auth.signInWithOAuth({
      provider: 'vkontakte' as any,
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback${redirectTo ? `?next=${redirectTo}` : ''}`,
      },
    });
  }

  // Reset password
  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      const supabase = getSupabaseBrowserClient();
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  }
}
