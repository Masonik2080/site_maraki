// lib/services/cart.client.ts
// Client-side cart service
'use client';

import type { Product, ProductType } from '@/lib/dao/types';

export interface CartItemClient {
  id: string;
  product: Product;
  quantity: number;
  lineTotal: number;
}

export interface CartClient {
  id: string;
  items: CartItemClient[];
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
}

// Cart update listeners with optimistic count
type CartListener = (optimisticDelta?: number) => void;
const cartListeners = new Set<CartListener>();

// Optimistic count for instant UI updates
let optimisticCount: number | null = null;

function notifyCartUpdate(delta?: number) {
  // If delta provided, update optimistic count immediately
  if (delta !== undefined && optimisticCount !== null) {
    optimisticCount = Math.max(0, optimisticCount + delta);
  }
  cartListeners.forEach(listener => listener(delta));
}

export function subscribeToCart(callback: CartListener) {
  cartListeners.add(callback);
  return () => cartListeners.delete(callback);
}

export function getOptimisticCount(): number | null {
  return optimisticCount;
}

export function setOptimisticCount(count: number) {
  optimisticCount = count;
}

export class CartClientService {
  
  // Get cart
  static async getCart(): Promise<CartClient | null> {
    try {
      const res = await fetch('/api/cart');
      if (!res.ok) return null;
      return res.json();
    } catch {
      return null;
    }
  }

  // Add item to cart
  static async addItem(
    productId: string, 
    productType: ProductType = 'variant_pack',
    quantity: number = 1
  ): Promise<boolean> {
    // Optimistic update - notify immediately with +1
    notifyCartUpdate(quantity);
    
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, productType, quantity }),
      });
      
      if (!res.ok) {
        // Revert on error
        notifyCartUpdate(-quantity);
        return false;
      }
      
      return true;
    } catch {
      // Revert on error
      notifyCartUpdate(-quantity);
      return false;
    }
  }

  // Remove item from cart
  static async removeItem(itemId: string): Promise<boolean> {
    // Optimistic update - notify immediately with -1
    notifyCartUpdate(-1);
    
    try {
      const res = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        // Revert on error
        notifyCartUpdate(1);
        return false;
      }
      
      return true;
    } catch {
      // Revert on error
      notifyCartUpdate(1);
      return false;
    }
  }

  // Update item quantity
  static async updateQuantity(itemId: string, quantity: number): Promise<boolean> {
    try {
      const res = await fetch('/api/cart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity }),
      });
      
      if (res.ok) {
        notifyCartUpdate();
      }
      
      return res.ok;
    } catch {
      return false;
    }
  }

  // Clear cart
  static async clearCart(): Promise<boolean> {
    try {
      const res = await fetch('/api/cart', {
        method: 'DELETE',
      });
      
      if (res.ok) {
        notifyCartUpdate();
      }
      
      return res.ok;
    } catch {
      return false;
    }
  }

  // Create order from cart
  static async checkout(): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      
      notifyCartUpdate();
      return { success: true, orderId: data.orderId };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  }

  // Pay for order (demo)
  static async payOrder(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const res = await fetch(`/api/orders/${orderId}/pay`, {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      
      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  }

  // Claim free items (price = 0)
  static async claimFree(): Promise<{ success: boolean; orderId?: string; error?: string }> {
    try {
      const res = await fetch('/api/orders/claim-free', {
        method: 'POST',
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      
      notifyCartUpdate();
      return { success: true, orderId: data.orderId };
    } catch {
      return { success: false, error: 'Ошибка сети' };
    }
  }
}
