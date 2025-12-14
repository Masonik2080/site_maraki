// app/api/auth/callback/route.ts
// OAuth callback handler
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Безопасная валидация redirect URL (защита от Open Redirect)
function getSafeRedirectUrl(next: string | null): string {
  if (!next) return '/dashboard';
  
  // Только относительные пути, начинающиеся с /
  // Запрещаем //, http://, https://, javascript: и т.д.
  if (
    next.startsWith('/') && 
    !next.startsWith('//') && 
    !next.includes(':')
  ) {
    return next;
  }
  
  return '/dashboard';
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeRedirectUrl(searchParams.get('next'));

  // Get the real origin from headers or env (Docker returns 0.0.0.0 for request.url)
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'https';
  const origin = host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || 'https://infkege.ru';

  if (code) {
    const supabase = await getSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
