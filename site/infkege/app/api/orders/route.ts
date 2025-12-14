// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthRepository, CartRepository, OrderRepository } from '@/lib/dao';
import { ProductsService } from '@/lib/services/products.service';

// GET /api/orders — get user's orders
export async function GET() {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orders = await OrderRepository.getUserOrders(user.id);

    return NextResponse.json({
      orders: orders.map(order => ({
        id: order.id,
        orderNumber: order.id.split('-')[0].toUpperCase(),
        status: order.status,
        total: order.total,
        itemCount: order.items.length,
        items: order.items.map(item => ({
          title: item.productTitle,
          type: item.productType,
          price: item.priceAtPurchase,
        })),
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString(),
      })),
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/orders — create order from cart
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

    // НЕ очищаем корзину здесь — она очистится после успешной оплаты
    // Это решает проблему когда пользователь не завершил оплату

    return NextResponse.json({
      success: true,
      orderId: order.id,
      total: order.total,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
