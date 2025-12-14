// components/checkout/checkout-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PaymentMethodSelector } from './payment-method-selector';
import { QrPaymentModal } from './qr-payment-modal';
import { CartClientService, subscribeToCart } from '@/lib/services/cart.client';
import { PaymentClientService } from '@/lib/services/payment.client';
import {
  Loader2,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Shield,
  CheckCircle,
  Clock,
} from 'lucide-react';

// Локальный тип для избежания проблем с импортом server-only модуля
type PaymentMethod = 'sbp' | 'card' | 'tpay';

interface CartItem {
  id: string;
  title: string;
  description?: string;
  price: number;
  originalPrice?: number;
  quantity: number;
  lineTotal: number;
}

interface CartData {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

interface CheckoutFormProps {
  cart: CartData;
}

type CheckoutStep = 'cart' | 'creating' | 'paying' | 'success';

// Helper to recalculate cart totals
function recalculateCart(items: CartItem[]): CartData {
  const total = items.reduce((sum, i) => sum + i.lineTotal, 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (i.originalPrice || i.price) * i.quantity, 
    0
  );
  return { items, total, subtotal, discount: subtotal - total };
}

export function CheckoutForm({ cart: initialCart }: CheckoutFormProps) {
  const router = useRouter();
  
  // Cart state — optimistic updates directly on state
  const [cart, setCart] = useState(initialCart);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('sbp');
  const [step, setStep] = useState<CheckoutStep>('cart');
  const [error, setError] = useState<string | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  
  // Payment state
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  
  // Восстанавливаем orderId из sessionStorage на клиенте
  useEffect(() => {
    const pendingOrderId = sessionStorage.getItem('pendingOrderId');
    if (pendingOrderId) {
      setOrderId(pendingOrderId);
    }
  }, []);
  
  // Auto-refresh cart on mount and when items are added externally
  // This handles the case when user navigates here before addItem completes
  useEffect(() => {
    // Refresh cart from server to get latest items
    const refreshCart = async () => {
      const freshCart = await CartClientService.getCart();
      if (freshCart) {
        setCart({
          items: freshCart.items.map(item => ({
            id: item.id,
            title: item.product.title,
            description: item.product.description,
            price: item.product.price,
            originalPrice: item.product.originalPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
          subtotal: freshCart.subtotal,
          discount: freshCart.discount,
          total: freshCart.total,
        });
      }
    };
    
    // Refresh immediately on mount
    refreshCart();
    
    // Subscribe to cart updates - only refresh on non-optimistic updates (delta === undefined)
    // When delta is provided, it means optimistic update happened and we handle it locally
    const unsubscribe = subscribeToCart((delta) => {
      if (delta === undefined) {
        // Full refresh needed (e.g., external change, page navigation)
        refreshCart();
      }
      // When delta is provided, we already handle it optimistically in handleRemoveItem
    });
    
    return () => { unsubscribe(); };
  }, []);
  
  // Удаление товара — мгновенное обновление UI
  const handleRemoveItem = (itemId: string) => {
    // Мгновенно убираем из UI
    const newItems = cart.items.filter(i => i.id !== itemId);
    setCart(recalculateCart(newItems));
    
    // Фоновый запрос к API (не ждём)
    CartClientService.removeItem(itemId);
  };
  
  // Очистка корзины — мгновенное обновление UI
  const handleClearCart = () => {
    // Мгновенно очищаем UI
    setCart(recalculateCart([]));
    
    // Фоновый запрос к API (не ждём)
    CartClientService.clearCart();
  };
  
  // Получение бесплатных товаров
  const handleClaimFree = async () => {
    setError(null);
    setStep('creating');
    
    try {
      const result = await CartClientService.claimFree();
      
      if (!result.success) {
        throw new Error(result.error || 'Ошибка получения доступа');
      }
      
      setStep('success');
      sessionStorage.removeItem('pendingOrderId');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setStep('cart');
    }
  };

  // Оформление заказа и оплата
  const handleCheckout = async () => {
    setError(null);
    setStep('creating');
    
    try {
      // 1. Создаем заказ
      const orderResult = await CartClientService.checkout();
      
      if (!orderResult.success || !orderResult.orderId) {
        throw new Error(orderResult.error || 'Ошибка создания заказа');
      }
      
      setOrderId(orderResult.orderId);
      sessionStorage.setItem('pendingOrderId', orderResult.orderId);
      
      // 2. Создаем платеж
      const paymentResult = await PaymentClientService.createPayment(
        orderResult.orderId,
        paymentMethod
      );
      
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Ошибка создания платежа');
      }
      
      setPaymentId(paymentResult.paymentId || null);
      
      // 3. Обрабатываем в зависимости от метода оплаты
      if (paymentMethod === 'sbp' && paymentResult.qrPayload) {
        // СБП — показываем QR-код
        setQrPayload(paymentResult.qrPayload);
        setShowQrModal(true);
        setStep('paying');
      } else if (paymentResult.paymentUrl) {
        // Карта/T-Pay — редирект на платежную форму
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error('Не удалось получить данные для оплаты');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      setStep('cart');
    }
  };
  
  // Успешная оплата
  const handlePaymentSuccess = () => {
    setShowQrModal(false);
    setStep('success');
    sessionStorage.removeItem('pendingOrderId');
  };
  
  // Закрытие QR модала
  const handleQrModalClose = () => {
    setShowQrModal(false);
    setStep('cart');
  };
  
  // Рендер успешной оплаты
  if (step === 'success') {
    return (
      <div className="text-center py-16">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-semibold text-text-primary mb-2">
          Оплата прошла успешно!
        </h2>
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
  
  // Use cart for rendering
  const displayCart = cart;
  
  // Рендер когда есть pending order (вернулись со страницы оплаты)
  if (displayCart.items.length === 0 && orderId) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
          Заказ ожидает оплаты
        </h2>
        <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
          Если вы уже оплатили заказ, подождите несколько минут — доступ откроется автоматически
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/dashboard')} className="h-11">
            Проверить доступ
          </Button>
          <Button 
            variant="outline" 
            onClick={() => {
              sessionStorage.removeItem('pendingOrderId');
              setOrderId(null);
              router.push('/shop');
            }} 
            className="h-11"
          >
            Новый заказ
          </Button>
        </div>
      </div>
    );
  }
  
  // Рендер пустой корзины
  if (displayCart.items.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-7 h-7 text-zinc-500" />
        </div>
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-white mb-2">
          Корзина пуста
        </h2>
        <p className="text-zinc-500 mb-6">Добавьте курсы из магазина</p>
        <Button onClick={() => router.push('/shop')} className="h-11">
          <ShoppingBag className="w-4 h-4 mr-2" />
          Перейти в магазин
        </Button>
      </div>
    );
  }
  
  const isLoading = step === 'creating' || step === 'paying';
  
  return (
    <>
      <div className="space-y-6">
        {/* Товары */}
        <div className="border border-border-main rounded-2xl divide-y divide-border-main overflow-hidden">
          {displayCart.items.map((item) => (
            <div 
              key={item.id} 
              className="p-5 flex items-center gap-4 bg-[--color-page-bg] transition-opacity"
            >
              <div className="w-12 h-12 rounded-xl bg-action/10 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-action" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-text-primary">{item.title}</h3>
                {item.description && (
                  <p className="text-sm text-text-secondary line-clamp-1">
                    {item.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className="font-semibold text-text-primary">
                  {item.price.toLocaleString('ru-RU')} ₽
                </div>
                {item.originalPrice && item.originalPrice > item.price && (
                  <div className="text-xs text-text-secondary line-through">
                    {item.originalPrice.toLocaleString('ru-RU')} ₽
                  </div>
                )}
              </div>
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={isLoading}
                className="p-2 text-text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        
        {/* Очистить корзину */}
        <button
          onClick={handleClearCart}
          disabled={isLoading}
          className="text-xs text-text-secondary hover:text-red-500 transition-colors disabled:opacity-50"
        >
          Очистить корзину
        </button>
        
        {/* Выбор способа оплаты — только если total > 0 */}
        {displayCart.total > 0 && (
          <div className="border border-border-main rounded-2xl p-6 bg-[--color-page-bg]">
            <PaymentMethodSelector
              selected={paymentMethod}
              onChange={setPaymentMethod}
              disabled={isLoading}
            />
          </div>
        )}
        
        {/* Итого и кнопка оплаты/получения */}
        <div className="border border-border-main rounded-2xl p-6 bg-[--color-page-bg]">
          <h3 className="font-semibold text-text-primary mb-4">Итого</h3>
          
          <div className="space-y-3 mb-6">
            {displayCart.discount > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Сумма без скидки</span>
                  <span className="text-text-secondary">
                    {displayCart.subtotal.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-600 font-medium">Скидка</span>
                  <span className="text-emerald-600 font-medium">
                    −{displayCart.discount.toLocaleString('ru-RU')} ₽
                  </span>
                </div>
              </>
            )}
            <div className="flex justify-between pt-4 border-t border-border-main">
              <span className="font-semibold text-text-primary text-lg">
                {displayCart.total > 0 ? 'К оплате' : 'Итого'}
              </span>
              <span className="text-2xl font-bold text-text-primary">
                {displayCart.total > 0 
                  ? `${displayCart.total.toLocaleString('ru-RU')} ₽`
                  : 'Бесплатно'
                }
              </span>
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
              {error}
            </div>
          )}
          
          {displayCart.total > 0 ? (
            <>
              <Button 
                className="w-full h-12 text-base" 
                onClick={handleCheckout} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {step === 'creating' ? 'Создание заказа...' : 'Подготовка оплаты...'}
                  </>
                ) : (
                  <>
                    Оплатить {displayCart.total.toLocaleString('ru-RU')} ₽
                  </>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-2 mt-4 text-xs text-text-secondary">
                <Shield className="w-3.5 h-3.5" />
                <span>Безопасная оплата через Т-Банк</span>
              </div>
            </>
          ) : (
            <Button 
              className="w-full h-12 text-base" 
              onClick={handleClaimFree} 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Получение доступа...
                </>
              ) : (
                'Получить'
              )}
            </Button>
          )}
        </div>
        
        <p className="text-xs text-text-secondary text-center">
          Нажимая «{displayCart.total > 0 ? 'Оплатить' : 'Получить'}», вы соглашаетесь с{' '}
          <a href="/terms" className="underline hover:text-text-primary">
            условиями оферты
          </a>
        </p>
      </div>
      
      {/* QR Modal */}
      {showQrModal && paymentId && qrPayload && (
        <QrPaymentModal
          isOpen={showQrModal}
          onClose={handleQrModalClose}
          onSuccess={handlePaymentSuccess}
          paymentId={paymentId}
          qrPayload={qrPayload}
          amount={displayCart.total}
        />
      )}
    </>
  );
}
