// components/shop/course-card.tsx
'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { CourseProduct } from '@/lib/dao/types';
import { CartClientService, subscribeToCart } from '@/lib/services/cart.client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ShoppingCart, Sparkles, BookOpen, Zap, User, ArrowRight } from 'lucide-react';

interface CourseCardProps {
  course: CourseProduct;
  /** ID товаров которые уже в корзине */
  cartProductIds?: string[];
}

const ICON_MAP: Record<string, typeof BookOpen> = {
  BookOpen,
  Zap,
  User,
  Sparkles,
};

type CartState = 'idle' | 'adding' | 'added' | 'in-cart';

export function CourseCard({ course, cartProductIds = [] }: CourseCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isPending, startTransition] = useTransition();
  
  // Check if already in cart (from server props)
  const isInCart = cartProductIds.includes(course.id);
  
  // Optimistic state for cart button (using useState for instant updates)
  const [optimisticState, setOptimisticState] = useState<CartState>(
    isInCart ? 'in-cart' : 'idle'
  );
  
  // Sync state when cartProductIds changes (e.g., after cart clear)
  useEffect(() => {
    setOptimisticState(isInCart ? 'in-cart' : 'idle');
  }, [isInCart]);
  
  // Listen for cart clear events (when delta is undefined = full reload needed)
  useEffect(() => {
    const handleCartUpdate = (delta?: number) => {
      // If no delta, it's a full cart operation (clear, checkout, etc.)
      // We need to check if this item is still in cart
      if (delta === undefined) {
        CartClientService.getCart().then(cart => {
          if (cart) {
            const stillInCart = cart.items.some(item => item.product.id === course.id);
            setOptimisticState(stillInCart ? 'in-cart' : 'idle');
          } else {
            setOptimisticState('idle');
          }
        });
      }
    };
    
    const unsubscribe = subscribeToCart(handleCartUpdate);
    return () => { unsubscribe(); };
  }, [course.id]);

  const discount = course.originalPrice 
    ? Math.round((1 - course.price / course.originalPrice) * 100) 
    : 0;

  const isFree = course.price === 0;
  const hasPackages = !!course.purchaseOptions?.packages?.length;
  const Icon = ICON_MAP[course.iconName || 'BookOpen'] || BookOpen;

  const handleAddToCart = () => {
    if (!user) {
      router.push('/login?redirect=/shop');
      return;
    }

    // Optimistically show "added" state IMMEDIATELY (sync, no await)
    setOptimisticState('added');
    
    // Fire and forget - checkout page will auto-refresh when this completes
    CartClientService.addItem(course.id, 'course').then(success => {
      if (!success) {
        setOptimisticState('idle');
      } else {
        setOptimisticState('in-cart');
      }
    });
  };

  const handleBuyNow = () => {
    if (!user) {
      router.push('/login?redirect=/shop');
      return;
    }

    // Если есть пакеты — переходим на страницу курса
    if (hasPackages) {
      router.push(`/shop/${course.slug}`);
      return;
    }

    // Если уже в корзине — сразу на checkout
    if (isInCart || optimisticState === 'in-cart') {
      router.push('/checkout');
      return;
    }

    startTransition(async () => {
      setOptimisticState('adding');
      await CartClientService.addItem(course.id, 'course');
      router.push('/checkout');
    });
  };
  
  const showInCart = optimisticState === 'in-cart' || optimisticState === 'added';
  const isLoading = isPending && optimisticState === 'adding';

  return (
    <div className="relative flex flex-col rounded-2xl border border-border-main bg-[--color-page-bg] overflow-hidden hover:shadow-lg hover:border-action/20 transition-all group">
      {/* Popular badge */}
      {course.popular && (
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-action text-action-text shadow-sm">
            <Sparkles className="w-3 h-3" />
            Популярное
          </span>
        </div>
      )}

      {/* Thumbnail */}
      <div className="aspect-[16/10] w-full bg-gradient-to-br from-action/5 to-action/10 flex items-center justify-center relative overflow-hidden">
        {course.thumbnailUrl ? (
          <img 
            src={course.thumbnailUrl} 
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <Icon className="w-12 h-12 text-action/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-5">
        {/* Subtitle */}
        {course.subtitle && (
          <div className="flex items-center gap-1.5 text-xs font-medium text-text-secondary mb-2">
            <Icon className="w-3.5 h-3.5" />
            <span className="uppercase tracking-wide">{course.subtitle}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-text-primary text-lg mb-2 line-clamp-2 group-hover:text-action transition-colors">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-4">
            {course.description}
          </p>
        )}

        {/* Features */}
        {course.features && course.features.length > 0 && (
          <ul className="space-y-1.5 mb-4 flex-1">
            {course.features.slice(0, 3).map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="line-clamp-1">{feature.text}</span>
              </li>
            ))}
            {course.features.length > 3 && (
              <li className="text-xs text-text-secondary pl-6">
                +{course.features.length - 3} ещё
              </li>
            )}
          </ul>
        )}

        {/* Price */}
        <div className="mt-auto pt-4 border-t border-border-main">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-2">
              {isFree ? (
                <span className="text-xl font-bold text-emerald-600">Бесплатно</span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-text-primary">
                    {course.price.toLocaleString('ru-RU')} ₽
                  </span>
                  {course.originalPrice && (
                    <span className="text-sm text-text-secondary line-through">
                      {course.originalPrice.toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </>
              )}
            </div>
            {discount > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {isFree ? (
              <Button asChild className="w-full h-10">
                <Link href={`/learn/${course.slug}`}>
                  Начать бесплатно
                </Link>
              </Button>
            ) : hasPackages ? (
              <Button asChild className="w-full h-10">
                <Link href={`/shop/${course.slug}`}>
                  Выбрать пакет
                </Link>
              </Button>
            ) : showInCart ? (
              /* Товар уже в корзине — можно сразу переходить, checkout сам обновится */
              <Button asChild className="w-full h-10">
                <Link href="/checkout">
                  <Check className="w-4 h-4 mr-1.5 text-emerald-400" />
                  В корзине — оформить
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
            ) : (
              <>
                <Button 
                  className="w-full h-10"
                  onClick={handleBuyNow}
                  disabled={isPending}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Купить'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full h-10"
                  onClick={handleAddToCart}
                  disabled={isPending}
                >
                  <ShoppingCart className="w-4 h-4 mr-1.5" />
                  В корзину
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
