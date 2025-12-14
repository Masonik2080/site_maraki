// lib/payment/transaction.repository.ts
// Репозиторий для работы с транзакциями — server-side only
import 'server-only';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import type {
  PaymentMethod,
  PaymentStatus,
  TransactionStatus,
  TransactionLog,
} from './types';

interface CreateTransactionInput {
  orderId: string;
  userId: string;
  providerPaymentId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  productNames: string[];
  status: TransactionStatus;
  providerStatus?: PaymentStatus;
  errorMessage?: string;
}

interface UpdateTransactionInput {
  status?: TransactionStatus;
  providerStatus?: PaymentStatus;
  errorMessage?: string;
  completedAt?: Date;
}

export class TransactionRepository {
  
  /**
   * Создание записи транзакции
   */
  static async create(input: CreateTransactionInput): Promise<TransactionLog | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        order_id: input.orderId,
        user_id: input.userId,
        provider_transaction_id: input.providerPaymentId || null,
        payment_provider: 'tbank',
        amount: input.amount,
        currency: 'RUB',
        status: input.status,
        payment_method_details: {
          method: input.paymentMethod,
          providerStatus: input.providerStatus,
          productNames: input.productNames,
        },
        error_message: input.errorMessage || null,
      })
      .select()
      .single();
    
    if (error || !data) {
      console.error('[TransactionRepository] Create error:', error);
      return null;
    }
    
    return this.mapToTransaction(data);
  }
  
  /**
   * Получение транзакции по ID платежа провайдера
   */
  static async getByPaymentId(paymentId: string): Promise<TransactionLog | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('provider_transaction_id', paymentId)
      .single();
    
    if (error || !data) return null;
    
    return this.mapToTransaction(data);
  }
  
  /**
   * Получение транзакции по ID заказа
   */
  static async getByOrderId(orderId: string): Promise<TransactionLog | null> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) return null;
    
    return this.mapToTransaction(data);
  }
  
  /**
   * Получение всех транзакций пользователя
   */
  static async getByUserId(userId: string): Promise<TransactionLog[]> {
    const supabase = getSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) return [];
    
    return data.map(this.mapToTransaction);
  }
  
  /**
   * Обновление транзакции по ID платежа провайдера
   */
  static async updateByPaymentId(
    paymentId: string,
    input: UpdateTransactionInput
  ): Promise<boolean> {
    const supabase = getSupabaseAdminClient();
    
    const updates: Record<string, unknown> = {};
    
    if (input.status) {
      updates.status = input.status;
    }
    
    if (input.providerStatus) {
      // Обновляем в payment_method_details
      const { data: existing } = await supabase
        .from('transactions')
        .select('payment_method_details')
        .eq('provider_transaction_id', paymentId)
        .single();
      
      if (existing) {
        updates.payment_method_details = {
          ...(existing.payment_method_details as object || {}),
          providerStatus: input.providerStatus,
        };
      }
    }
    
    if (input.errorMessage) {
      updates.error_message = input.errorMessage;
    }
    
    if (input.completedAt || input.status === 'completed') {
      updates.processed_at = (input.completedAt || new Date()).toISOString();
    }
    
    const { error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('provider_transaction_id', paymentId);
    
    return !error;
  }
  
  /**
   * Логирование события транзакции (для аудита)
   */
  static async logEvent(
    paymentId: string,
    event: string,
    details?: Record<string, unknown>
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();
    
    // Получаем текущую транзакцию
    const { data: transaction } = await supabase
      .from('transactions')
      .select('payment_method_details')
      .eq('provider_transaction_id', paymentId)
      .single();
    
    if (!transaction) return;
    
    const currentDetails = transaction.payment_method_details as Record<string, unknown> || {};
    const eventLog = (currentDetails.eventLog as unknown[]) || [];
    
    eventLog.push({
      event,
      timestamp: new Date().toISOString(),
      ...details,
    });
    
    await supabase
      .from('transactions')
      .update({
        payment_method_details: {
          ...currentDetails,
          eventLog,
        },
      })
      .eq('provider_transaction_id', paymentId);
  }
  
  /**
   * Маппинг данных из БД
   */
  private static mapToTransaction(data: any): TransactionLog {
    const details = data.payment_method_details as Record<string, unknown> || {};
    
    return {
      id: data.id,
      orderId: data.order_id,
      userId: data.user_id,
      providerPaymentId: data.provider_transaction_id || '',
      paymentMethod: (details.method as PaymentMethod) || 'card',
      amount: Number(data.amount),
      currency: data.currency,
      status: data.status as TransactionStatus,
      providerStatus: details.providerStatus as PaymentStatus | undefined,
      productNames: (details.productNames as string[]) || [],
      errorMessage: data.error_message || undefined,
      metadata: details,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.created_at),
      completedAt: data.processed_at ? new Date(data.processed_at) : undefined,
    };
  }
}
