// app/api/admin/users/[userId]/balance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/dao/user.repository';

// POST /api/admin/users/[userId]/balance - Update balance
export async function POST(
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
  const { amount, type, description } = body;

  if (typeof amount !== 'number' || !['add', 'subtract', 'set'].includes(type)) {
    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  }

  const success = await UserRepository.updateBalance(userId, amount, type, description);

  if (!success) {
    return NextResponse.json({ error: 'Balance update failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
