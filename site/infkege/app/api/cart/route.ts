// app/api/cart/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthRepository, CartRepository } from '@/lib/dao';
import { ProductsService } from '@/lib/services/products.service';

// GET /api/cart — get user's cart
export async function GET() {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const cart = await CartRepository.getOrCreateCart(user.id);
    
    // Enrich with product data
    const { subtotal, discount, total, itemsWithProducts } = 
      ProductsService.calculateCartTotals(cart.items);

    // Создаём map для получения itemId по productId
    const itemIdMap = new Map(cart.items.map(i => [i.productId, i.id]));

    return NextResponse.json({
      id: cart.id,
      items: itemsWithProducts.map(item => ({
        id: itemIdMap.get(item.productId) || item.productId, // itemId для удаления
        productId: item.productId,
        product: item.product,
        quantity: item.quantity,
        lineTotal: item.lineTotal,
      })),
      subtotal,
      discount,
      total,
      itemCount: cart.items.length,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST /api/cart — add item to cart
export async function POST(request: NextRequest) {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, productType = 'variant_pack', quantity = 1 } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    // Verify product exists
    const product = ProductsService.getProductById(productId);
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    await CartRepository.addItem(user.id, productId, productType, quantity);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// DELETE /api/cart — remove item or clear cart
export async function DELETE(request: NextRequest) {
  try {
    const user = await AuthRepository.getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (itemId) {
      await CartRepository.removeItem(user.id, itemId);
    } else {
      await CartRepository.clearCart(user.id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
