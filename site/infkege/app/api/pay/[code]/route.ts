// app/api/pay/[code]/route.ts
// Публичный API для получения информации о ссылке и оплаты
import { NextRequest, NextResponse } from 'next/server';
import { PaymentLinkRepository } from '@/lib/dao/payment-link.repository';
import { getSupabaseServerClient } from '@/lib/supabase/server';

// Константы безопасности
const MAX_CONTACT_INFO_LENGTH = 200;
const MAX_CONTACT_TYPE_LENGTH = 50;
const VALID_PAYMENT_METHODS = ['sbp', 'card', 'tpay'] as const;
const VALID_CONTACT_TYPES = ['email', 'phone', 'telegram', 'other'] as const;

interface RouteParams {
  params: Promise<{ code: string }>;
}

// Санитизация строки (удаление опасных символов)
function sanitizeString(str: string, maxLength: number): string {
  return String(str || '')
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Базовая защита от XSS
}

// GET — получить информацию о ссылке
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  
  // Валидация кода (только буквы и цифры, макс 32 символа)
  const sanitizedCode = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  if (!sanitizedCode) {
    return NextResponse.json({ error: 'Некорректный код' }, { status: 400 });
  }
  
  const { available, reason, link } = await PaymentLinkRepository.checkAvailability(sanitizedCode);
  
  if (!available || !link) {
    return NextResponse.json({ error: reason || 'Ссылка недоступна' }, { status: 404 });
  }

  // Проверяем авторизацию если требуется
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (link.requiresAuth && !user) {
    return NextResponse.json({
      error: 'Требуется авторизация',
      requiresAuth: true,
      redirectUrl: `/login?redirect=/pay/${sanitizedCode}`,
    }, { status: 401 });
  }

  // Возвращаем ТОЛЬКО публичную информацию (без внутренних ID)
  return NextResponse.json({
    link: {
      code: link.code,
      amount: link.amount,
      description: link.description,
      allowSbp: link.allowSbp,
      allowCard: link.allowCard,
      allowTpay: link.allowTpay,
      requiresAuth: link.requiresAuth,
    },
    // Не раскрываем полный user.id клиенту
    isAuthenticated: !!user,
    userEmail: user?.email || null,
  });
}

// POST — инициировать оплату
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  
  // Валидация кода
  const sanitizedCode = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  if (!sanitizedCode) {
    return NextResponse.json({ error: 'Некорректный код' }, { status: 400 });
  }
  
  // ВАЖНО: Повторно проверяем доступность на бэкенде (не доверяем фронтенду)
  const { available, reason, link } = await PaymentLinkRepository.checkAvailability(sanitizedCode);
  
  if (!available || !link) {
    return NextResponse.json({ error: reason || 'Ссылка недоступна' }, { status: 404 });
  }

  // Проверяем авторизацию
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (link.requiresAuth && !user) {
    return NextResponse.json({ error: 'Требуется авторизация' }, { status: 401 });
  }

  try {
    const body = await request.json();
    
    // === СТРОГАЯ ВАЛИДАЦИЯ НА БЭКЕНДЕ ===
    
    // Способ оплаты: строго из списка
    const paymentMethod = body.paymentMethod;
    if (!paymentMethod || !VALID_PAYMENT_METHODS.includes(paymentMethod)) {
      return NextResponse.json({ error: 'Некорректный способ оплаты' }, { status: 400 });
    }

    // Проверяем что способ разрешён для ЭТОЙ ссылки (не доверяем фронтенду)
    if (paymentMethod === 'sbp' && !link.allowSbp) {
      return NextResponse.json({ error: 'СБП недоступен' }, { status: 400 });
    }
    if (paymentMethod === 'card' && !link.allowCard) {
      return NextResponse.json({ error: 'Карта недоступна' }, { status: 400 });
    }
    if (paymentMethod === 'tpay' && !link.allowTpay) {
      return NextResponse.json({ error: 'T-Pay недоступен' }, { status: 400 });
    }

    // Контактные данные: санитизация
    const contactInfo = sanitizeString(body.contactInfo || '', MAX_CONTACT_INFO_LENGTH);
    const contactType = VALID_CONTACT_TYPES.includes(body.contactType) 
      ? body.contactType 
      : 'other';

    // Для неавторизованных — требуем контактные данные
    if (!user && !contactInfo) {
      return NextResponse.json({ 
        error: 'Укажите контактные данные' 
      }, { status: 400 });
    }

    // Создаём запись о платеже
    const payment = await PaymentLinkRepository.createPayment({
      linkId: link.id,
      userId: user?.id,
      contactInfo: contactInfo || undefined,
      contactType: contactInfo ? contactType : undefined,
    });

    if (!payment) {
      return NextResponse.json({ error: 'Ошибка создания платежа' }, { status: 500 });
    }

    // Инициируем платёж через Тбанк
    // ВАЖНО: Сумма берётся из БД (link.amount), а НЕ из запроса клиента!
    const { PaymentService } = await import('@/lib/payment');
    
    const result = await PaymentService.createPayment({
      orderId: payment.id,
      userId: user?.id || 'guest',
      amount: link.amount, // Сумма из БД, не от клиента!
      description: link.description, // Описание из БД, не от клиента!
      productNames: [link.description],
      paymentMethod,
      customerEmail: user?.email || (contactType === 'email' ? contactInfo : undefined),
    });

    if (!result.success) {
      await PaymentLinkRepository.updatePayment(payment.id, { status: 'failed' });
      return NextResponse.json({ error: result.error || 'Ошибка оплаты' }, { status: 500 });
    }

    // Обновляем платёж
    await PaymentLinkRepository.updatePayment(payment.id, {
      providerPaymentId: result.paymentId,
      paymentMethod,
    });

    return NextResponse.json({
      paymentId: payment.id,
      providerPaymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
      qrPayload: result.qrPayload,
    });

  } catch (error) {
    console.error('[API] Pay error:', error);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
