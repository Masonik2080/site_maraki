// app/api/admin/payment-links/[id]/route.ts
// API для управления конкретной ссылкой
import { NextRequest, NextResponse } from 'next/server';
import { PaymentLinkRepository, type PaymentLinkStatus } from '@/lib/dao/payment-link.repository';
import { checkAdminAccess } from '@/lib/dao';

// Валидные статусы
const VALID_STATUSES: PaymentLinkStatus[] = ['active', 'expired', 'exhausted', 'disabled'];

// Валидация UUID
function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET — получить ссылку с платежами
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const { id } = await params;
  
  // Валидация ID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
  }
  
  const link = await PaymentLinkRepository.getById(id);
  
  if (!link) {
    return NextResponse.json({ error: 'Ссылка не найдена' }, { status: 404 });
  }

  const payments = await PaymentLinkRepository.getPaymentsByLinkId(id);
  
  return NextResponse.json({ link, payments });
}

// PATCH — обновить статус
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const { id } = await params;
  
  // Валидация ID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
  }
  
  try {
    const body = await request.json();
    
    // Строгая валидация статуса
    if (body.status) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: 'Некорректный статус' }, { status: 400 });
      }
      
      // Проверяем что ссылка существует
      const existingLink = await PaymentLinkRepository.getById(id);
      if (!existingLink) {
        return NextResponse.json({ error: 'Ссылка не найдена' }, { status: 404 });
      }
      
      const success = await PaymentLinkRepository.updateStatus(id, body.status);
      if (!success) {
        return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 });
      }
    }

    const link = await PaymentLinkRepository.getById(id);
    return NextResponse.json({ link });
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
}

// DELETE — удалить ссылку
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminCheck = await checkAdminAccess();
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });
  }

  const { id } = await params;
  
  // Валидация ID
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: 'Некорректный ID' }, { status: 400 });
  }
  
  // Проверяем что ссылка существует
  const existingLink = await PaymentLinkRepository.getById(id);
  if (!existingLink) {
    return NextResponse.json({ error: 'Ссылка не найдена' }, { status: 404 });
  }
  
  const success = await PaymentLinkRepository.delete(id);
  
  if (!success) {
    return NextResponse.json({ error: 'Ошибка удаления' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
