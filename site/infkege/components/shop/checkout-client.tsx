// components/shop/checkout-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CartClientService } from '@/lib/services/cart.client';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, CreditCard, CheckCircle, ShoppingBag, ArrowRight, Shield } from 'lucide-react';

interface CartItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  lineTotal: number;
}

interface CheckoutClientProps {
  cart: {
    items: CartItem[];
    subtotal: number;
    discount: number;
    total: number;
  };
}

export function CheckoutClient({ cart: initialCart }: CheckoutClientProps) {
  const router = useRouter();
  const [cart, setCart] = useState(initialCart);
  const [loading, setLoading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [step, setStep] = useState<'cart' | 'processing' | 'success'>('cart');
  const [error, setError] = useState<string | null>(null);

  const handleRemoveItem = async (itemId: string) => {
    setRemovingId(itemId);
    const success = await CartClientService.removeItem(itemId);
    if (success) {
      const newItems = cart.items.filter(i => i.id !== itemId);
      const newTotal = newItems.reduce((sum, i) => sum + i.lineTotal, 0);
      const newSubtotal = newItems.reduce((sum, i) => sum + (i.originalPrice || i.price) * i.quantity, 0);
      setCart({
        ...cart,
        items: newItems,
        total: newTotal,
        subtotal: newSubtotal,
        discount: newSubtotal - newTotal,
      });
    }
    setRemovingId(null);
  };

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);
    setStep('processing');

    const orderResult = await CartClientService.checkout();
    
    if (!orderResult.success || !orderResult.orderId) {
      setError(orderResult.error || 'Ошибка создания заказа');
      setStep('cart');
      setLoading(false);
      return;
    }

    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const payResult = await CartClientService.payOrder(orderResult.orderId);
    
    if (!payResult.success) {
      setError(payResult.error || 'Ошибка оплаты');
      setStep('cart');
      setLoading(false);
      return;
    }

    setStep('success');
    setLoading(false);
  };

  if (step === 'processing') {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-action/10 flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-action animate-spin" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Обрабатываем платёж...</h2>
        <p className="text-text-secondary">Пожалуйста, не закрывайте страницу</p>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-semibold text-text-primary mb-2">Оплата прошла успешно!</h2>
        <p className="text-text-secondary mb-8 max-w-sm mx-auto">
          Доступ к материалам открыт. Вы можете начать обучение прямо сейчас.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/dashboard')} className="h-11 px-6">
            Перейти к курсам
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => router.push('/shop')} className="h-11">
            Продолжить покупки
          </Button>
        </div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-[--color-zinc-100] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7 text-text-secondary" />
        </div>
        <h2 className="text-xl font-semibold text-text-primary mb-2">Корзина пуста</h2>
        <p className="text-text-secondary mb-6">Добавьте курсы из магазина</p>
        <Button onClick={() => router.push('/shop')} className="h-11">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Перейти в магазин
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border border-border-main rounded-2xl divide-y divide-border-main overflow-hidden">
        {cart.items.map((item) => (
          <div 
            key={item.id} 
            className={`p-5 flex items-center gap-4 bg-[--color-page-bg] transition-opacity ${
              removingId === item.id ? 'opacity-50' : ''
            }`}
          >
            <div className="w-12 h-12 rounded-xl bg-action/10 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5 text-action" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-text-primary">{item.title}</h3>
              {item.description && (
                <p className="text-sm text-text-secondary line-clamp-1">{item.description}</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-semibold text-text-primary">{item.price.toLocaleString('ru-RU')} ₽</div>
              {item.originalPrice && item.originalPrice > item.price && (
                <div className="text-xs text-text-secondary line-through">
                  {item.originalPrice.toLocaleString('ru-RU')} ₽
                </div>
              )}
            </div>
            <button
              onClick={() => handleRemoveItem(item.id)}
              disabled={removingId === item.id}
              className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
            >
              {removingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>

      <div className="border border-border-main rounded-2xl p-6 bg-[--color-page-bg]">
        <h3 className="font-semibold text-text-primary mb-4">Итого</h3>
        <div className="space-y-3 mb-6">
          {cart.discount > 0 && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Сумма без скидки</span>
                <span className="text-text-secondary">{cart.subtotal.toLocaleString('ru-RU')} ₽</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-emerald-600 font-medium">Скидка</span>
                <span className="text-emerald-600 font-medium">−{cart.discount.toLocaleString('ru-RU')} ₽</span>
              </div>
            </>
          )}
          <div className="flex justify-between pt-4 border-t border-border-main">
            <span className="font-semibold text-text-primary text-lg">К оплате</span>
            <span className="text-2xl font-bold text-text-primary">{cart.total.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
            {error}
          </div>
        )}

        <Button className="w-full h-12 text-base" onClick={handleCheckout} disabled={loading}>
          {loading ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Обработка...</>
          ) : (
            <><CreditCard className="w-5 h-5 mr-2" />Оплатить {cart.total.toLocaleString('ru-RU')} ₽</>
          )}
        </Button>

        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-text-secondary">
          <Shield className="w-3.5 h-3.5" />
          <span>Безопасная оплата</span>
        </div>
      </div>

      <p className="text-xs text-text-secondary text-center">
        Нажимая «Оплатить», вы соглашаетесь с{' '}
        <a href="/terms" className="underline hover:text-text-primary">условиями оферты</a>
      </p>
    </div>
  );
}
