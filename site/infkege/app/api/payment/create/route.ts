// app/api/payment/create/route.ts
// API для создания платежа
import { NextRequest, NextResponse } from 'next/server';
import { AuthRepository, OrderRepository } from '@/lib/dao';
import { PaymentService } from '@/lib/payment';
import type { PaymentMethod } from '@/lib/payment';

interface CreatePaymentBody {
  orderId: string;
  paymentMethod: PaymentMethod;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Проверка авторизации
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      console.log('[Payment API] Unauthorized');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Парсинг тела запроса
    const body: CreatePaymentBody = await request.json();
    console.log('[Payment API] Request body:', body);

    if (!body.orderId || !body.paymentMethod) {
      console.log('[Payment API] Missing fields:', { orderId: body.orderId, paymentMethod: body.paymentMethod });
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 3. Валидация метода оплаты
    const validMethods: PaymentMethod[] = ['sbp', 'card', 'tpay'];
    if (!validMethods.includes(body.paymentMethod)) {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }
    
    // 4. Получение заказа
    const order = await OrderRepository.getOrderById(body.orderId);
    console.log('[Payment API] Order:', order ? { id: order.id, status: order.status, total: order.total } : null);

    if (!order) {
      console.log('[Payment API] Order not found:', body.orderId);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // 5. Проверка владельца заказа
    if (order.userId !== user.id) {
      console.log('[Payment API] Access denied. Order user:', order.userId, 'Current user:', user.id);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // 6. Проверка статуса заказа
    if (order.status === 'completed') {
      console.log('[Payment API] Order already paid');
      return NextResponse.json(
        { error: 'Order already paid' },
        { status: 400 }
      );
    }

    // 7. Собираем названия товаров для описания
    const productNames = order.items.map((item) => item.productTitle);
    console.log('[Payment API] Creating payment for products:', productNames);

    // 8. Создаем платеж
    const result = await PaymentService.createPayment({
      orderId: order.id,
      userId: user.id,
      amount: order.total,
      description: `Заказ ${order.id.slice(0, 8).toUpperCase()}`,
      productNames,
      paymentMethod: body.paymentMethod,
      customerEmail: user.email,
    });

    console.log('[Payment API] Payment result:', result);

    if (!result.success) {
      console.log('[Payment API] Payment failed:', result.error, result.errorCode);
      return NextResponse.json(
        {
          error: result.error || 'Payment creation failed',
          errorCode: result.errorCode,
        },
        { status: 400 }
      );
    }
    
    // 9. Возвращаем данные для оплаты
    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl,
      qrPayload: result.qrPayload,
      paymentMethod: body.paymentMethod,
    });
    
  } catch (error) {
    console.error('[API] Payment create error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
