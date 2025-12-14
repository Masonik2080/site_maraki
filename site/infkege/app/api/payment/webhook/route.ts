// app/api/payment/webhook/route.ts
// Webhook endpoint для нотификаций от Тбанк
import { NextRequest, NextResponse } from 'next/server';
import { WebhookHandler } from '@/lib/payment';
import type { TbankNotification } from '@/lib/payment';

/**
 * POST /api/payment/webhook
 * 
 * Тбанк отправляет POST-запрос с данными о статусе платежа.
 * Важно: всегда возвращать 200 OK, иначе Тбанк будет повторять запрос.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Парсим тело запроса
    const body: TbankNotification = await request.json();
    
    // 2. Логируем входящий вебхук (без токена для безопасности)
    console.log('[Webhook] Received notification:', {
      PaymentId: body.PaymentId,
      OrderId: body.OrderId,
      Status: body.Status,
      Success: body.Success,
      Amount: body.Amount,
    });
    
    // 3. Обрабатываем нотификацию
    const result = await WebhookHandler.handleNotification(body);
    
    if (!result.success) {
      console.error('[Webhook] Processing failed:', result.message);
      // Всё равно возвращаем OK, чтобы Тбанк не повторял запрос
    }
    
    // 4. Тбанк ожидает ответ "OK" в теле
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
    
  } catch (error) {
    console.error('[Webhook] Error:', error);
    
    // Возвращаем OK даже при ошибке, чтобы избежать повторных запросов
    return new NextResponse('OK', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

// Вебхуки не кэшируются по умолчанию (POST запросы)
