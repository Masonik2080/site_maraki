// proxy.ts
import { NextResponse, type NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

// Routes that require authentication
const PROTECTED_ROUTES = ['/dashboard', '/checkout', '/learn', '/api/cart', '/api/orders'];

// Admin routes - require admin role
const ADMIN_ROUTES = ['/admin', '/api/admin'];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = ['/login'];

// Routes excluded from maintenance mode
const MAINTENANCE_EXCLUDED = ['/maintenance', '/sorry', '/admin', '/api/admin', '/api/auth', '/_next', '/favicon.ico'];

// Simple in-memory cache for admin checks (cleared on server restart)
const adminCache = new Map<string, { isAdmin: boolean; expires: number }>();
const CACHE_TTL = 60 * 1000; // 1 minute

// Cache for maintenance mode (short TTL to allow quick toggle)
let maintenanceCache: { enabled: boolean; expires: number } | null = null;
const MAINTENANCE_CACHE_TTL = 10 * 1000; // 10 seconds

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip static files and API routes that don't need auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const { supabase, response } = await createSupabaseMiddlewareClient(request);
  
  // Refresh session if exists
  const { data: { user } } = await supabase.auth.getUser();

  // Check maintenance mode (skip for excluded routes and admins)
  const isExcludedFromMaintenance = MAINTENANCE_EXCLUDED.some(route => pathname.startsWith(route));
  
  if (!isExcludedFromMaintenance) {
    let maintenanceEnabled = false;
    
    // Check cache first
    if (maintenanceCache && maintenanceCache.expires > Date.now()) {
      maintenanceEnabled = maintenanceCache.enabled;
    } else {
      // Fetch from database
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('category', 'general')
        .eq('key', 'maintenanceMode')
        .single();
      
      maintenanceEnabled = data?.value === true;
      maintenanceCache = { enabled: maintenanceEnabled, expires: Date.now() + MAINTENANCE_CACHE_TTL };
    }
    
    if (maintenanceEnabled) {
      // Allow admins to bypass maintenance
      let isAdmin = false;
      if (user) {
        const cached = adminCache.get(user.id);
        if (cached && cached.expires > Date.now()) {
          isAdmin = cached.isAdmin;
        } else {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('user_id', user.id)
            .single();
          isAdmin = profile?.role === 'admin';
          adminCache.set(user.id, { isAdmin, expires: Date.now() + CACHE_TTL });
        }
      }
      
      if (!isAdmin) {
        return NextResponse.redirect(new URL('/maintenance', request.url));
      }
    }
  }

  // Check route types
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route));
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route));

  // Redirect to login if accessing protected route without auth
  if ((isProtectedRoute || isAdminRoute) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Check admin access
  if (isAdminRoute && user) {
    let isAdmin = false;
    const cached = adminCache.get(user.id);
    
    if (cached && cached.expires > Date.now()) {
      isAdmin = cached.isAdmin;
    } else {
      // Check role in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      isAdmin = profile?.role === 'admin';
      adminCache.set(user.id, { isAdmin, expires: Date.now() + CACHE_TTL });
    }

    if (!isAdmin) {
      // Redirect non-admins to dashboard with error
      return NextResponse.redirect(new URL('/dashboard?error=access_denied', request.url));
    }
  }

  // Redirect to dashboard if accessing auth routes while logged in
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
