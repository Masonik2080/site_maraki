// app/api/orders/[orderId]/pay/route.ts
// ВНИМАНИЕ: Этот эндпоинт ОТКЛЮЧЕН!
// Оплата должна происходить через /api/payment/create -> платёжная система -> webhook
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/orders/[orderId]/pay
 * 
 * ОТКЛЮЧЕНО! Этот эндпоинт был уязвимостью — позволял обойти оплату.
 * Используйте /api/payment/create для инициации оплаты через Тбанк.
 */
export async function POST(request: NextRequest) {
  // Этот эндпоинт полностью отключен
  // Правильный флоу: /api/payment/create -> Тбанк -> /api/payment/webhook
  return NextResponse.json(
    { 
      error: 'This endpoint is disabled. Use /api/payment/create instead.',
      hint: 'Payment must go through the payment provider'
    },
    { status: 403 }
  );
}
