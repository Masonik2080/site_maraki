// app/api/admin/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/dao/user.repository';

// GET /api/admin/users - List users with pagination, search, sorting
export async function GET(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const search = searchParams.get('search') || '';
  const sortBy = (searchParams.get('sortBy') || 'created_at') as any;
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc';
  const role = searchParams.get('role') || undefined;

  try {
    const result = await UserRepository.getUsers({
      page,
      limit,
      search,
      sortBy,
      sortOrder,
      role,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API /admin/users] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
