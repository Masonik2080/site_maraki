// lib/dao/order.repository.ts
// Order operations — server-side only with cache invalidation
import 'server-only';
import { cache } from 'react';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag } from 'next/cache';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type { Order, OrderItem, OrderStatus, ProductType } from './types';

interface CreateOrderInput {
  userId: string;
  items: {
    productId: string;
    productType: ProductType;
    productTitle: string;
    price: number;
    quantity: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
}

export class OrderRepository {
  
  // Create new order
  static async createOrder(input: CreateOrderInput): Promise<Order | null> {
    const supabase = getSupabaseAdminClient();
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: input.userId,
        subtotal_amount: input.subtotal,
        discount_amount: input.discount,
        total_amount: input.total,
        status: 'awaiting_payment',
      })
      .select()
      .single();
    
    if (orderError || !order) return null;
    
    // Create order items
    const orderItems = input.items.map(item => ({
      order_id: order.id,
      product_id_external: item.productId,
      product_type: item.productType,
      product_name_at_purchase: item.productTitle,
      product_title: item.productTitle,
      price_at_purchase: item.price,
      quantity: item.quantity,
    }));
    
    await supabase.from('order_items').insert(orderItems);
    
    return this.getOrderById(order.id);
  }

  // Get order by ID
  static async getOrderById(orderId: string): Promise<Order | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', orderId)
      .single();
    
    if (error || !data) return null;
    
    return this.mapToOrder(data);
  }

  // Get user orders - cached with React cache for request deduplication
  static getUserOrders = cache(async (userId: string): Promise<Order[]> => {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(this.mapToOrder);
  });

  // Update order status
  static async updateStatus(orderId: string, status: OrderStatus): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const updates: any = { 
      status, 
      updated_at: new Date().toISOString() 
    };
    
    if (status === 'completed') {
      updates.paid_at = new Date().toISOString();
    }
    
    console.log('[OrderRepository] updateStatus:', orderId, status, updates);
    
    const { error, data } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select();
    
    console.log('[OrderRepository] updateStatus result:', { error, data });
    
    return !error;
  }

  // Update provider payment ID
  static async setProviderPaymentId(orderId: string, paymentId: string): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const { error } = await supabase
      .from('orders')
      .update({
        provider_payment_id: paymentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);
    
    return !error;
  }

  // Get order by provider payment ID
  static async getByProviderPaymentId(paymentId: string): Promise<Order | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('provider_payment_id', paymentId)
      .single();
    
    if (error || !data) return null;
    
    return this.mapToOrder(data);
  }

  // Mark order as paid (completed) and grant access
  static async markAsPaid(orderId: string): Promise<boolean> {
    const order = await this.getOrderById(orderId);
    if (!order) return false;
    
    const supabase = getSupabaseAdminClient();
    
    // Update order status to 'completed' (в БД ENUM это значение для оплаченных заказов)
    await this.updateStatus(orderId, 'completed');
    
    // Импортируем ProductsService для получения courseId из пакетов
    const { ProductsService } = await import('@/lib/services/products.service');
    
    // Grant access for each item
    for (const item of order.items) {
      // Определяем courseId — для пакетов берём из продукта, для курсов — productId
      let courseId = item.productId;
      let packageId: string | null = null;
      
      if (item.productType === 'variant_pack') {
        // Для пакета вариантов — получаем courseId из продукта
        const product = ProductsService.getProductById(item.productId);
        if (product && 'courseId' in product) {
          courseId = (product as any).courseId;
          packageId = item.productId;
        }
      }
      
      // Проверяем, нет ли уже такого же доступа (по course_id + package_id)
      let query = supabase
        .from('user_course_access')
        .select('id')
        .eq('user_id', order.userId)
        .eq('course_id', courseId);
      
      // Для пакетов проверяем точное совпадение package_id
      if (packageId) {
        query = query.eq('package_id', packageId);
      } else {
        query = query.is('package_id', null);
      }
      
      const { data: existingAccess } = await query.limit(1);
      
      if (!existingAccess || existingAccess.length === 0) {
        await supabase.from('user_course_access').insert({
          user_id: order.userId,
          course_id: courseId,
          package_id: packageId,
          product_title: item.productTitle,
        });
      }
      
      // Log access grant
      await supabase.from('access_log').insert({
        user_id: order.userId,
        product_id_external: item.productId,
        product_type: item.productType,
        order_item_id: item.id,
        action: 'grant',
        grantor_type: 'system',
      });
    }
    
    return true;
  }

  // Private mapper
  private static mapToOrder(data: any): Order {
    const items: OrderItem[] = (data.order_items || []).map((item: any) => ({
      id: String(item.id),
      productId: item.product_id_external,
      productType: item.product_type as ProductType,
      productTitle: item.product_title || item.product_name_at_purchase,
      priceAtPurchase: item.price_at_purchase,
      quantity: item.quantity,
    }));
    
    return {
      id: data.id,
      userId: data.user_id,
      status: data.status as OrderStatus,
      subtotal: data.subtotal_amount,
      discount: data.discount_amount,
      total: data.total_amount,
      items,
      createdAt: new Date(data.created_at),
      paidAt: data.paid_at ? new Date(data.paid_at) : undefined,
    };
  }
}
