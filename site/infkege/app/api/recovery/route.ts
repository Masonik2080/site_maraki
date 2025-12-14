import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { AuthRepository } from '@/lib/dao';

export async function POST(request: NextRequest) {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const supabase = getSupabaseAdminClient();

    const body = await request.json();
    const { hasDocuments, selectedItems, comment } = body;

    if (!selectedItems || selectedItems.length === 0) {
      return NextResponse.json({ error: 'No items selected' }, { status: 400 });
    }

    // Проверяем, нет ли уже активной (pending) заявки
    const { data: pendingRequest } = await supabase
      .from('recovery_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (pendingRequest) {
      return NextResponse.json({ 
        error: 'У вас уже есть заявка в рассмотрении' 
      }, { status: 400 });
    }

    // Создаём заявку
    const { data, error } = await supabase
      .from('recovery_requests')
      .insert({
        user_id: user.id,
        email: user.email,
        has_documents: hasDocuments,
        selected_items: selectedItems,
        comment: comment || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Recovery request error:', error);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (error) {
    console.error('Recovery API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();

    // Получаем все заявки пользователя
    const { data: allRequests } = await supabase
      .from('recovery_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    const requests = allRequests || [];
    
    // Активная заявка (pending) — если есть
    const pendingRequest = requests.find(r => r.status === 'pending') || null;
    
    // История (все кроме pending)
    const history = requests.filter(r => r.status !== 'pending');

    return NextResponse.json({ 
      request: pendingRequest,
      history 
    });
  } catch {
    return NextResponse.json({ request: null, history: [] });
  }
}
