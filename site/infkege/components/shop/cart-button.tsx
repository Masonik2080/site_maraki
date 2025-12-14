// components/shop/cart-button.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { CartClientService, subscribeToCart, setOptimisticCount } from '@/lib/services/cart.client';

export function CartButton() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const loadCart = useCallback(async () => {
    const cart = await CartClientService.getCart();
    if (cart) {
      setCount(cart.itemCount);
      setOptimisticCount(cart.itemCount);
    }
  }, []);

  // Handle cart updates (with optimistic delta)
  const handleCartUpdate = useCallback((delta?: number) => {
    if (delta !== undefined) {
      // Optimistic update - instant!
      setCount(prev => Math.max(0, prev + delta));
    } else {
      // Full reload (e.g., after page navigation)
      loadCart();
    }
  }, [loadCart]);

  useEffect(() => {
    setMounted(true);
    loadCart();
    
    // Subscribe to cart updates with optimistic support
    const unsubscribe = subscribeToCart(handleCartUpdate);
    return () => { unsubscribe(); };
  }, [loadCart, handleCartUpdate]);

  return (
    <Link 
      href="/checkout" 
      className="relative p-2 text-text-secondary hover:text-text-primary transition-colors"
      aria-label="Корзина"
    >
      <ShoppingCart className="w-5 h-5" />
      {mounted && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-action text-action-text text-[10px] font-semibold flex items-center justify-center px-1 animate-in zoom-in duration-200">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  );
}
