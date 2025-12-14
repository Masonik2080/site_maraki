// lib/dao/cart.repository.ts
// Cart operations — server-side only with cache invalidation
import 'server-only';
import { cache } from 'react';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { Cart, CartItem, ProductType } from './types';

export class CartRepository {
  
  // Get or create cart for user
  static async getOrCreateCart(userId: string): Promise<Cart> {
    const supabase = getSupabaseAdminClient();
    
    // Try to get existing cart
    let { data: cart } = await supabase
      .from('carts')
      .select('*, cart_items(*)')
      .eq('user_id', userId)
      .single();
    
    // Create if not exists
    if (!cart) {
      const { data: newCart } = await supabase
        .from('carts')
        .insert({ user_id: userId })
        .select('*, cart_items(*)')
        .single();
      cart = newCart;
    }
    
    return this.mapToCart(cart);
  }

  // Add item to cart
  static async addItem(
    userId: string, 
    productId: string, 
    productType: ProductType,
    quantity: number = 1
  ): Promise<Cart | null> {
    const supabase = getSupabaseAdminClient();
    
    // Get cart
    const cart = await this.getOrCreateCart(userId);
    
    // Check if item already exists
    const existingItem = cart.items.find(
      i => i.productId === productId && i.productType === productType
    );
    
    if (existingItem) {
      // Update quantity
      await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);
    } else {
      // Add new item
      await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id_external: productId,
          product_type: productType,
          quantity,
        });
    }
    
    // Update cart timestamp
    await supabase
      .from('carts')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', cart.id);
    
    return this.getOrCreateCart(userId);
  }

  // Remove item from cart
  static async removeItem(userId: string, itemId: string): Promise<Cart | null> {
    const supabase = getSupabaseAdminClient();
    
    const cart = await this.getOrCreateCart(userId);
    
    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('cart_id', cart.id);
    
    return this.getOrCreateCart(userId);
  }

  // Update item quantity
  static async updateItemQuantity(
    userId: string, 
    itemId: string, 
    quantity: number
  ): Promise<Cart | null> {
    const supabase = getSupabaseAdminClient();
    
    if (quantity <= 0) {
      return this.removeItem(userId, itemId);
    }
    
    const cart = await this.getOrCreateCart(userId);
    
    await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('cart_id', cart.id);
    
    return this.getOrCreateCart(userId);
  }

  // Clear cart
  static async clearCart(userId: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const cart = await this.getOrCreateCart(userId);
    
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);
    
    if (!error) {
      await this.invalidateCartCache(userId);
    }
    
    return !error;
  }
  
  // Invalidate cart cache after mutations
  static async invalidateCartCache(userId: string): Promise<void> {
    const { revalidateTag } = await import('next/cache');
    revalidateTag(`cart:${userId}`, 'page');
  }

  // Private mapper
  private static mapToCart(data: any): Cart {
    const items: CartItem[] = (data?.cart_items || []).map((item: any) => ({
      id: String(item.id),
      productId: item.product_id_external,
      productType: item.product_type as ProductType,
      quantity: item.quantity,
    }));
    
    return {
      id: data?.id || '',
      userId: data?.user_id || '',
      items,
      subtotal: 0, // Will be calculated with products
      discount: 0,
      total: 0,
    };
  }
}
