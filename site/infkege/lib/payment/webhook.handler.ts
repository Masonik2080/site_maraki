// lib/payment/webhook.handler.ts
// Обработчик вебхуков от Тбанк — server-side only
import 'server-only';
import { verifyNotificationToken } from './token';
import { TransactionRepository } from './transaction.repository';
import { OrderRepository } from '@/lib/dao/order.repository';
import { CartRepository } from '@/lib/dao/cart.repository';
import type { TbankNotification, PaymentStatus, TransactionStatus } from './types';

interface WebhookResult {
  success: boolean;
  message: string;
}

export class WebhookHandler {
  
  /**
   * Обработка входящего вебхука от Тбанк
   */
  static async handleNotification(body: TbankNotification): Promise<WebhookResult> {
    // 1. Верификация токена
    const { Token, ...paramsWithoutToken } = body;
    
    if (!verifyNotificationToken(paramsWithoutToken, Token)) {
      console.error('[Webhook] Invalid token for PaymentId:', body.PaymentId);
      return { success: false, message: 'Invalid token' };
    }
    
    const paymentId = String(body.PaymentId);
    const status = body.Status;
    const orderId = body.OrderId;
    
    // 2. Логируем событие
    await TransactionRepository.logEvent(paymentId, 'webhook_received', {
      status,
      success: body.Success,
      errorCode: body.ErrorCode,
      amount: body.Amount,
    });
    
    // 3. Получаем транзакцию
    const transaction = await TransactionRepository.getByPaymentId(paymentId);
    
    if (!transaction) {
      console.error('[Webhook] Transaction not found:', paymentId);
      return { success: false, message: 'Transaction not found' };
    }
    
    // 4. Обновляем статус транзакции
    const transactionStatus = this.mapProviderStatus(status);
    
    await TransactionRepository.updateByPaymentId(paymentId, {
      status: transactionStatus,
      providerStatus: status,
      completedAt: transactionStatus === 'completed' ? new Date() : undefined,
    });
    
    // 5. Обрабатываем успешную оплату
    if (status === 'CONFIRMED' || status === 'AUTHORIZED') {
      await this.handleSuccessfulPayment(orderId, paymentId);
    }
    
    // 6. Обрабатываем неуспешные статусы
    if (status === 'REJECTED' || status === 'AUTH_FAIL' || status === 'CANCELED') {
      await this.handleFailedPayment(orderId, paymentId, status);
    }
    
    return { success: true, message: 'OK' };
  }
  
  /**
   * Обработка успешной оплаты
   */
  private static async handleSuccessfulPayment(
    orderId: string,
    paymentId: string
  ): Promise<void> {
    try {
      // Сначала проверяем, это обычный заказ или платёж по ссылке
      const order = await OrderRepository.getOrderById(orderId);
      
      if (order) {
        // Это обычный заказ
        if (order.status === 'completed') {
          console.log('[Webhook] Order already paid:', orderId);
          return;
        }
        
        const success = await OrderRepository.markAsPaid(orderId);
        
        if (success) {
          await CartRepository.clearCart(order.userId);
          
          await TransactionRepository.logEvent(paymentId, 'order_completed', {
            orderId,
            itemCount: order.items.length,
          });
          
          console.log('[Webhook] Order completed:', orderId);
        } else {
          console.error('[Webhook] Failed to mark order as paid:', orderId);
        }
      } else {
        // Возможно это платёж по ссылке (orderId = payment_link_payments.id)
        await this.handlePaymentLinkSuccess(orderId, paymentId);
      }
      
    } catch (error) {
      console.error('[Webhook] Error processing successful payment:', error);
    }
  }
  
  /**
   * Обработка успешной оплаты по платёжной ссылке
   */
  private static async handlePaymentLinkSuccess(
    paymentRecordId: string,
    providerPaymentId: string
  ): Promise<void> {
    try {
      const { PaymentLinkRepository } = await import('@/lib/dao/payment-link.repository');
      
      // Получаем платёж
      const payment = await PaymentLinkRepository.getPaymentById(paymentRecordId);
      
      if (!payment) {
        console.log('[Webhook] Payment link record not found:', paymentRecordId);
        return;
      }
      
      if (payment.status === 'completed') {
        console.log('[Webhook] Payment link already completed:', paymentRecordId);
        return;
      }
      
      // Обновляем статус платежа
      const success = await PaymentLinkRepository.updatePayment(paymentRecordId, {
        status: 'completed',
        paidAt: new Date(),
        providerPaymentId,
      });
      
      if (success) {
        // Инкрементируем счётчик использований ссылки
        console.log('[Webhook] Incrementing uses for link:', payment.linkId);
        const incrementResult = await PaymentLinkRepository.incrementUses(payment.linkId);
        console.log('[Webhook] Increment result:', incrementResult);
        
        // Проверяем, не исчерпан ли лимит (получаем свежие данные после инкремента)
        const link = await PaymentLinkRepository.getById(payment.linkId);
        console.log('[Webhook] Link after increment:', link ? { id: link.id, currentUses: link.currentUses, maxUses: link.maxUses, usageType: link.usageType } : null);
        
        if (link) {
          if (link.usageType === 'single' && link.currentUses >= 1) {
            await PaymentLinkRepository.updateStatus(link.id, 'exhausted');
            console.log('[Webhook] Link marked as exhausted (single use)');
          } else if (link.usageType === 'limited' && link.maxUses && link.currentUses >= link.maxUses) {
            await PaymentLinkRepository.updateStatus(link.id, 'exhausted');
            console.log('[Webhook] Link marked as exhausted (limited uses)');
          }
        }
        
        await TransactionRepository.logEvent(providerPaymentId, 'payment_link_completed', {
          paymentRecordId,
          linkId: payment.linkId,
        });
        
        console.log('[Webhook] Payment link payment completed:', paymentRecordId);
      }
    } catch (error) {
      console.error('[Webhook] Error processing payment link:', error);
    }
  }
  
  /**
   * Обработка неуспешной оплаты
   */
  private static async handleFailedPayment(
    orderId: string,
    paymentId: string,
    status: PaymentStatus
  ): Promise<void> {
    try {
      await TransactionRepository.logEvent(paymentId, 'payment_failed', {
        orderId,
        status,
      });
      
      // Можно добавить логику отмены заказа или уведомления пользователя
      console.log('[Webhook] Payment failed:', orderId, status);
      
    } catch (error) {
      console.error('[Webhook] Error processing failed payment:', error);
    }
  }
  
  /**
   * Маппинг статуса провайдера
   */
  private static mapProviderStatus(status: PaymentStatus): TransactionStatus {
    switch (status) {
      case 'NEW':
      case 'FORM_SHOWED':
        return 'pending';
      case 'AUTHORIZING':
      case 'CONFIRMING':
        return 'processing';
      case 'AUTHORIZED':
      case 'CONFIRMED':
        return 'completed';
      case 'CANCELED':
      case 'REVERSED':
      case 'DEADLINE_EXPIRED':
        return 'cancelled';
      case 'REFUNDED':
      case 'PARTIAL_REFUNDED':
        return 'refunded';
      case 'REJECTED':
      case 'AUTH_FAIL':
      default:
        return 'failed';
    }
  }
}
