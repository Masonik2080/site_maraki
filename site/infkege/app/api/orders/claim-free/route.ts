// app/api/orders/claim-free/route.ts
// Endpoint для получения бесплатных товаров (цена = 0)
import { NextRequest, NextResponse } from 'next/server';
import { AuthRepository, CartRepository, OrderRepository } from '@/lib/dao';
import { ProductsService } from '@/lib/services/products.service';

/**
 * POST /api/orders/claim-free
 * 
 * Создаёт заказ из корзины и сразу выдаёт доступ, если total = 0.
 * Для бесплатных товаров не требуется оплата.
 */
export async function POST(request: NextRequest) {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cart = await CartRepository.getOrCreateCart(user.id);
    
    if (cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Calculate totals
    const { subtotal, discount, total, itemsWithProducts } = 
      ProductsService.calculateCartTotals(cart.items);

    // Проверяем что total действительно 0
    if (total > 0) {
      return NextResponse.json(
        { error: 'This endpoint is only for free items. Use regular checkout for paid items.' },
        { status: 400 }
      );
    }

    // Create order
    const order = await OrderRepository.createOrder({
      userId: user.id,
      items: itemsWithProducts.map(item => ({
        productId: item.productId,
        productType: item.product.type,
        productTitle: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
      })),
      subtotal,
      discount,
      total,
    });

    if (!order) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Сразу помечаем как оплаченный и выдаём доступ
    const success = await OrderRepository.markAsPaid(order.id);
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to grant access' }, { status: 500 });
    }

    // Очищаем корзину
    await CartRepository.clearCart(user.id);

    return NextResponse.json({
      success: true,
      orderId: order.id,
    });
  } catch (error) {
    console.error('[ClaimFree] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
