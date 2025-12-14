// app/api/orders/[orderId]/complete/route.ts
// ВНИМАНИЕ: Этот эндпоинт ОТКЛЮЧЕН в продакшене!
// Завершение заказа должно происходить ТОЛЬКО через webhook от платёжной системы.
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/orders/[orderId]/complete
 * 
 * ОТКЛЮЧЕНО! Этот эндпоинт был уязвимостью — позволял обойти оплату.
 * Завершение заказа теперь происходит только через /api/payment/webhook
 */
export async function POST(request: NextRequest) {
  // В продакшене этот эндпоинт должен быть полностью отключен
  // Если нужно для локального тестирования — проверяйте NODE_ENV
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'This endpoint is disabled in production' },
      { status: 403 }
    );
  }

  // Даже в dev режиме — требуем специальный секретный ключ
  const devSecret = request.headers.get('x-dev-secret');
  if (devSecret !== process.env.DEV_COMPLETE_SECRET) {
    return NextResponse.json(
      { error: 'Invalid dev secret' },
      { status: 403 }
    );
  }

  return NextResponse.json(
    { error: 'Manual completion disabled. Use webhook instead.' },
    { status: 403 }
  );
}
