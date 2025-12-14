// app/checkout/page.tsx
import { redirect } from 'next/navigation';
import { connection } from 'next/server';
import Link from 'next/link';
import { AuthRepository, CartRepository } from '@/lib/dao';
import { ProductsService } from '@/lib/services/products.service';
import { CheckoutForm } from '@/components/checkout';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Оформление заказа — InfKege',
};

export default async function CheckoutPage() {
  // Wait for connection to access cookies/headers
  await connection();
  
  const user = await AuthRepository.getCurrentUser();
  
  if (!user) {
    redirect('/login?redirect=/checkout');
  }

  const cart = await CartRepository.getOrCreateCart(user.id);
  const { subtotal, discount, total, itemsWithProducts } = 
    ProductsService.calculateCartTotals(cart.items);

  // Создаём map для получения itemId по productId
  const itemIdMap = new Map(cart.items.map(i => [i.productId, i.id]));

  // Передаём данные корзины (даже если пустая — CheckoutForm покажет "Корзина пуста")
  const cartData = {
    items: itemsWithProducts.map(item => ({
      id: itemIdMap.get(item.productId) || item.productId,
      productId: item.productId,
      title: item.product.title,
      description: item.product.description,
      price: item.product.price,
      originalPrice: item.product.originalPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal,
    discount,
    total,
  };

  return (
    <div className="layout-container py-10 min-h-[80vh]">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link 
          href="/shop" 
          className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Вернуться в магазин
        </Link>

        <h1 className="text-2xl font-bold text-text-primary mb-8">
          Оформление заказа
        </h1>
        
        <CheckoutForm cart={cartData} />
      </div>
    </div>
  );
}
