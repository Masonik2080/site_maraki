// app/api/admin/payment-links/route.ts
// API для управления платёжными ссылками
import { NextRequest, NextResponse } from 'next/server';
import { PaymentLinkRepository } from '@/lib/dao';
import { checkAdminAccess } from '@/lib/dao';

// Константы безопасности
const MAX_AMOUNT = 1_000_000; // Максимальная сумма 1 млн рублей
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_USES_LIMIT = 10_000;

// GET — получить все ссылки
export async function GET() {
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const links = await PaymentLinkRepository.getAll();
  return NextResponse.json({ links });
}

// POST — создать новую ссылку
export async function POST(request: NextRequest) {
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin || !adminCheck.userId) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  try {
    const body = await request.json();
    
    // === СТРОГАЯ ВАЛИДАЦИЯ НА БЭКЕНДЕ ===
    
    // Сумма: число, >= 10, <= MAX_AMOUNT
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount < 10 || amount > MAX_AMOUNT) {
      return NextResponse.json(
        { error: `Сумма должна быть от 10 до ${MAX_AMOUNT.toLocaleString('ru-RU')} рублей` },
        { status: 400 }
      );
    }
    
    // Описание: строка, не пустая, ограничена по длине
    const description = String(body.description || '').trim();
    if (!description || description.length > MAX_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `Описание обязательно (макс. ${MAX_DESCRIPTION_LENGTH} символов)` },
        { status: 400 }
      );
    }
    
    // Тип использования: строго из списка
    const usageType = body.usageType;
    if (!usageType || !['single', 'limited', 'unlimited'].includes(usageType)) {
      return NextResponse.json(
        { error: 'Некорректный тип использования' },
        { status: 400 }
      );
    }
    
    // maxUses: только для limited, число > 0
    let maxUses: number | undefined;
    if (usageType === 'limited') {
      maxUses = Number(body.maxUses);
      if (!Number.isInteger(maxUses) || maxUses < 1 || maxUses > MAX_USES_LIMIT) {
        return NextResponse.json(
          { error: `Количество использований: 1-${MAX_USES_LIMIT}` },
          { status: 400 }
        );
      }
    }
    
    // Способы оплаты: boolean
    const allowSbp = body.allowSbp === true;
    const allowCard = body.allowCard === true;
    const allowTpay = body.allowTpay === true;
    
    if (!allowSbp && !allowCard && !allowTpay) {
      return NextResponse.json(
        { error: 'Выберите хотя бы один способ оплаты' },
        { status: 400 }
      );
    }
    
    // Авторизация: boolean
    const requiresAuth = body.requiresAuth === true;
    
    // Срок истечения: валидная дата в будущем или undefined
    let expiresAt: Date | undefined;
    if (body.expiresAt) {
      const parsed = new Date(body.expiresAt);
      if (isNaN(parsed.getTime()) || parsed <= new Date()) {
        return NextResponse.json(
          { error: 'Дата истечения должна быть в будущем' },
          { status: 400 }
        );
      }
      expiresAt = parsed;
    }

    const link = await PaymentLinkRepository.create({
      amount,
      description,
      allowSbp,
      allowCard,
      allowTpay,
      requiresAuth,
      usageType,
      maxUses,
      expiresAt,
      createdBy: adminCheck.userId,
    });

    if (!link) {
      return NextResponse.json(
        { error: 'Ошибка создания ссылки' },
        { status: 500 }
      );
    }

    return NextResponse.json({ link });
  } catch (error) {
    console.error('[API] Create payment link error:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
