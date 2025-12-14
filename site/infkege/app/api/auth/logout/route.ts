// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await getSupabaseServerClient();
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка выхода' },
      { status: 500 }
    );
  }
}
