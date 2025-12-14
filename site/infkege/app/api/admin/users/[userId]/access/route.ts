// app/api/admin/users/[userId]/access/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { UserRepository } from '@/lib/dao/user.repository';

// POST /api/admin/users/[userId]/access - Grant access
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
  const { courseId, packageId, productTitle, reason } = body;

  if (!courseId) {
    return NextResponse.json({ error: 'courseId is required' }, { status: 400 });
  }

  const success = await UserRepository.grantAccess({
    userId,
    courseId,
    packageId,
    productTitle,
    grantorId: currentUser.id,
    reason,
  });

  if (!success) {
    return NextResponse.json({ error: 'Grant failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

// DELETE /api/admin/users/[userId]/access - Revoke access
export async function DELETE(
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

  const { searchParams } = new URL(request.url);
  const accessId = parseInt(searchParams.get('accessId') || '0');

  if (!accessId) {
    return NextResponse.json({ error: 'accessId is required' }, { status: 400 });
  }

  const success = await UserRepository.revokeAccess(userId, accessId, currentUser.id);

  if (!success) {
    return NextResponse.json({ error: 'Revoke failed' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
