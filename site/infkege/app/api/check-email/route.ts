import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Используем сервисный ключ для прав админа (или анон ключ, если функция открыта для public)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Создаем обычный админский клиент
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // --- ИСПРАВЛЕНИЕ ---
    // Вместо прямого запроса к auth.users, вызываем защищенную RPC функцию
    const { data: exists, error } = await supabaseAdmin
      .rpc('check_email_exists', { 
        email_arg: email.trim() 
      });

    if (error) {
      console.error('Supabase RPC error:', error);
      throw error;
    }

    return NextResponse.json({ exists: !!exists });

  } catch (error) {
    console.error('Internal Server Error in /api/check-email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}