// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { verifyCaptchaToken } from '@/lib/captcha';

export async function POST(request: NextRequest) {
  try {
    const { email, password, captchaToken } = await request.json();

    // Проверка капчи
    const captchaResult = await verifyCaptchaToken(captchaToken);
    if (!captchaResult.valid) {
      return NextResponse.json(
        { error: captchaResult.error },
        { status: 400 }
      );
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email и пароль обязательны' },
        { status: 400 }
      );
    }

    // Валидация email формата
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Неверный формат email' },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServerClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка сервера' },
      { status: 500 }
    );
  }
}
