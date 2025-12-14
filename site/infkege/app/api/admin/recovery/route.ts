import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { AuthRepository, AccessRepository } from '@/lib/dao';

// Маппинг наших ID на реальные course_id и package_id
// ВАЖНО: package_id должен совпадать с тем что в БД (pack-1, pack-2, pack-3)
const ITEM_MAPPING: Record<string, { courseId: string; packageId?: string; title: string }> = {
  'sbornik-all': {
    courseId: 'sbornik-variantov-urovnya-ege-ade8',
    // packageId не указан = полный доступ
    title: 'Сборник вариантов (полный)',
  },
  'pack-1': {
    courseId: 'sbornik-variantov-urovnya-ege-ade8',
    packageId: 'pack-1',
    title: 'Сборник: Пакет 1 (Варианты 1-25)',
  },
  'pack-2': {
    courseId: 'sbornik-variantov-urovnya-ege-ade8',
    packageId: 'pack-2',
    title: 'Сборник: Пакет 2 (Варианты 26-40)',
  },
  'pack-3': {
    courseId: 'sbornik-variantov-urovnya-ege-ade8',
    packageId: 'pack-3',
    title: 'Сборник: Пакет 3 (Варианты 41-50)',
  },
  'mt-course': {
    courseId: 'ekspress-kurs-po-novomu-zadaniyu-12-na-mashinu-tyuringa-mt-2f88',
    title: 'Экспресс-курс по МТ',
  },
  'fast-start': {
    courseId: 'ekspress-kurs-bistrii-start-8879',
    title: 'Быстрый старт',
  },
  'tutors': {
    courseId: 'obuchenie-repetitorov-perehod-na-ip-59d3',
    title: 'Обучение репетиторов',
  },
};

export async function GET(request: NextRequest) {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Проверяем роль админа
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = supabase
      .from('recovery_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Recovery requests fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
    }

    return NextResponse.json({
      requests: data || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error('Admin recovery API error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    
    // Проверяем роль админа
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();
    
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminComment, grantItems } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Получаем заявку для user_id
    const { data: requestData } = await supabase
      .from('recovery_requests')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!requestData) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Если одобряем — выдаём доступ к курсам
    if (status === 'approved' && grantItems && grantItems.length > 0) {
      for (const itemId of grantItems) {
        const mapping = ITEM_MAPPING[itemId];
        if (mapping) {
          await AccessRepository.grantAccess(
            requestData.user_id,
            mapping.courseId,
            mapping.packageId,
            `Восстановление: ${mapping.title}`
          );
        }
      }
    }

    const { data, error } = await supabase
      .from('recovery_requests')
      .update({
        status,
        admin_comment: adminComment || null,
        granted_items: status === 'approved' ? grantItems : null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Recovery request update error:', error);
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }

    return NextResponse.json({ success: true, request: data });
  } catch (error) {
    console.error('Admin recovery PATCH error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
