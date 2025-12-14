// app/api/admin/users/[userId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/dao/user.repository';

// GET /api/admin/users/[userId] - Get user details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const user = await UserRepository.getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const [access, orders] = await Promise.all([
    UserRepository.getUserAccess(userId),
    UserRepository.getUserOrders(userId),
  ]);

  return NextResponse.json({ user, access, orders });
}

// PATCH /api/admin/users/[userId] - Update user
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const supabase = await getSupabaseServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('user_id', currentUser.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const success = await UserRepository.updateUser(userId, body);

  if (!success) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
