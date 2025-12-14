// lib/payment/payment.service.ts
// Сервис для работы с платежами — server-side only
import 'server-only';
import { getTerminalKey, TBANK_CONFIG } from './config';
import { generateToken } from './token';
import { initPayment, getQr, getPaymentState, cancelPayment } from './api-client';
import { TransactionRepository } from './transaction.repository';
import type {
  PaymentStatus,
  TransactionStatus,
  CreatePaymentInput,
  PaymentResult,
  PaymentStatusResult,
} from './types';

export class PaymentService {
  
  /**
   * Создание платежа с выбранным методом оплаты
   */
  static async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    const terminalKey = getTerminalKey();
    const amountInKopecks = Math.round(input.amount * 100);
    
    // Валидация минимальной суммы для СБП
    if (input.paymentMethod === 'sbp' && amountInKopecks < TBANK_CONFIG.MIN_SBP_AMOUNT) {
      return {
        success: false,
        error: 'Минимальная сумма для оплаты через СБП — 10 рублей',
        errorCode: 'MIN_AMOUNT',
      };
    }
    
    // Формируем описание с названиями товаров
    const description = this.formatDescription(input.productNames);
    
    // Рассчитываем срок жизни QR/ссылки
    const redirectDueDate = this.getRedirectDueDate();
    
    // Базовые параметры запроса
    const baseParams = {
      TerminalKey: terminalKey,
      Amount: amountInKopecks,
      OrderId: input.orderId,
      Description: description,
      PayType: 'O' as const, // Одностадийная оплата
      Language: 'ru' as const,
      RedirectDueDate: redirectDueDate,
      SuccessURL: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/success?orderId=${input.orderId}`,
      FailURL: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout/fail?orderId=${input.orderId}`,
      NotificationURL: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/webhook`,
      CustomerKey: input.userId,
      DATA: {
        Email: input.customerEmail || '',
        connection_type: 'Widget',
      },
    };
    
    // Генерируем токен
    const token = generateToken(baseParams);
    
    try {
      console.log('[PaymentService] Init params:', {
        TerminalKey: terminalKey,
        Amount: amountInKopecks,
        OrderId: input.orderId,
        Description: description,
        PayType: baseParams.PayType,
        SuccessURL: baseParams.SuccessURL,
        FailURL: baseParams.FailURL,
        NotificationURL: baseParams.NotificationURL,
      });
      console.log('[PaymentService] Token generated:', token.substring(0, 16) + '...');

      // Инициализируем платеж
      const initResponse = await initPayment({
        ...baseParams,
        Token: token,
      });

      console.log('[PaymentService] Init response:', {
        Success: initResponse.Success,
        ErrorCode: initResponse.ErrorCode,
        Status: initResponse.Status,
        PaymentId: initResponse.PaymentId,
        PaymentURL: initResponse.PaymentURL,
      });

      if (!initResponse.Success) {
        return {
          success: false,
          error: initResponse.Message || 'Ошибка инициализации платежа',
          errorCode: initResponse.ErrorCode,
        };
      }
      
      // Создаем запись транзакции в БД
      await TransactionRepository.create({
        orderId: input.orderId,
        userId: input.userId,
        providerPaymentId: initResponse.PaymentId,
        paymentMethod: input.paymentMethod,
        amount: input.amount,
        productNames: input.productNames,
        status: 'pending',
        providerStatus: initResponse.Status,
      });
      
      // Сохраняем provider_payment_id в заказе
      const { OrderRepository } = await import('@/lib/dao/order.repository');
      await OrderRepository.setProviderPaymentId(input.orderId, initResponse.PaymentId);
      
      // Для СБП получаем QR-код
      if (input.paymentMethod === 'sbp') {
        return this.handleSbpPayment(initResponse.PaymentId, input.orderId);
      }
      
      // Для карты/T-Pay возвращаем URL платежной формы
      return {
        success: true,
        paymentId: initResponse.PaymentId,
        paymentUrl: initResponse.PaymentURL,
      };
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      // Логируем ошибку в транзакцию
      await TransactionRepository.create({
        orderId: input.orderId,
        userId: input.userId,
        providerPaymentId: '',
        paymentMethod: input.paymentMethod,
        amount: input.amount,
        productNames: input.productNames,
        status: 'failed',
        errorMessage: message,
      });
      
      return {
        success: false,
        error: message,
        errorCode: 'INIT_ERROR',
      };
    }
  }
  
  /**
   * Обработка СБП платежа — получение QR-кода
   */
  private static async handleSbpPayment(
    paymentId: string,
    orderId: string
  ): Promise<PaymentResult> {
    const terminalKey = getTerminalKey();
    
    const qrParams = {
      TerminalKey: terminalKey,
      PaymentId: Number(paymentId),
      DataType: 'PAYLOAD' as const,
    };
    
    console.log('[PaymentService] GetQr params:', qrParams);
    const qrToken = generateToken(qrParams);
    console.log('[PaymentService] GetQr token:', qrToken.substring(0, 16) + '...');
    
    try {
      const qrResponse = await getQr({
        ...qrParams,
        Token: qrToken,
      });
      
      console.log('[PaymentService] GetQr response:', {
        Success: qrResponse.Success,
        ErrorCode: qrResponse.ErrorCode,
        Data: qrResponse.Data?.substring(0, 50) + '...',
      });
      
      if (!qrResponse.Success) {
        return {
          success: false,
          error: qrResponse.Message || 'Ошибка получения QR-кода',
          errorCode: qrResponse.ErrorCode,
        };
      }
      
      return {
        success: true,
        paymentId,
        qrPayload: qrResponse.Data,
      };
      
    } catch (error) {
      console.error('[PaymentService] GetQr error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка получения QR',
        errorCode: 'QR_ERROR',
      };
    }
  }
  
  /**
   * Проверка статуса платежа
   */
  static async checkPaymentStatus(paymentId: string): Promise<PaymentStatusResult> {
    const terminalKey = getTerminalKey();
    
    const params = {
      TerminalKey: terminalKey,
      PaymentId: paymentId,
    };
    
    const token = generateToken(params);
    
    try {
      const response = await getPaymentState({
        ...params,
        Token: token,
      });
      
      const transactionStatus = this.mapProviderStatus(response.Status);
      const isPaid = response.Status === 'CONFIRMED' || response.Status === 'AUTHORIZED';
      
      // Обновляем статус в БД
      await TransactionRepository.updateByPaymentId(paymentId, {
        status: transactionStatus,
        providerStatus: response.Status,
        completedAt: isPaid ? new Date() : undefined,
      });
      
      // Если платёж успешен — выдаём доступ (на случай если webhook не пришёл)
      if (isPaid) {
        await this.grantAccessForPayment(paymentId);
      }
      
      return {
        success: true,
        status: response.Status,
        transactionStatus,
        isPaid,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Ошибка проверки статуса',
      };
    }
  }
  
  /**
   * Выдача доступа после успешной оплаты
   */
  private static async grantAccessForPayment(paymentId: string): Promise<void> {
    console.log('[PaymentService] grantAccessForPayment called with paymentId:', paymentId);
    
    try {
      const { OrderRepository } = await import('@/lib/dao/order.repository');
      const { CartRepository } = await import('@/lib/dao/cart.repository');
      
      // Получаем транзакцию
      const transaction = await TransactionRepository.getByPaymentId(paymentId);
      console.log('[PaymentService] Transaction found:', transaction ? transaction.orderId : 'NOT FOUND');
      
      if (!transaction) {
        // Попробуем найти заказ напрямую по provider_payment_id
        console.log('[PaymentService] Trying to find order by provider_payment_id...');
        const order = await OrderRepository.getByProviderPaymentId(paymentId);
        
        if (order) {
          console.log('[PaymentService] Found order directly:', order.id, 'status:', order.status);
          if (order.status !== 'completed') {
            const success = await OrderRepository.markAsPaid(order.id);
            console.log('[PaymentService] markAsPaid result:', success);
            if (success) {
              await CartRepository.clearCart(order.userId);
              console.log('[PaymentService] Access granted for order:', order.id);
            }
          }
        } else {
          console.error('[PaymentService] Order not found by provider_payment_id:', paymentId);
        }
        return;
      }
      
      // Получаем заказ
      const order = await OrderRepository.getOrderById(transaction.orderId);
      console.log('[PaymentService] Order found:', order ? order.id : 'NOT FOUND', 'status:', order?.status);
      
      if (!order) {
        console.error('[PaymentService] Order not found:', transaction.orderId);
        return;
      }
      
      // Если заказ уже оплачен — ничего не делаем
      if (order.status === 'completed') {
        console.log('[PaymentService] Order already paid:', order.id);
        return;
      }
      
      // Помечаем заказ как оплаченный и выдаём доступ
      console.log('[PaymentService] Calling markAsPaid for order:', order.id);
      const success = await OrderRepository.markAsPaid(order.id);
      console.log('[PaymentService] markAsPaid result:', success);
      
      if (success) {
        // Очищаем корзину
        await CartRepository.clearCart(order.userId);
        console.log('[PaymentService] Access granted for order:', order.id);
      } else {
        console.error('[PaymentService] markAsPaid failed for order:', order.id);
      }
    } catch (error) {
      console.error('[PaymentService] Error granting access:', error);
    }
  }
  
  /**
   * Отмена платежа
   */
  static async cancelPayment(paymentId: string, amount?: number): Promise<boolean> {
    const terminalKey = getTerminalKey();
    
    const params: Record<string, unknown> = {
      TerminalKey: terminalKey,
      PaymentId: paymentId,
    };
    
    if (amount !== undefined) {
      params.Amount = Math.round(amount * 100);
    }
    
    const token = generateToken(params);
    
    try {
      const response = await cancelPayment({
        TerminalKey: terminalKey,
        PaymentId: paymentId,
        Token: token,
        Amount: amount ? Math.round(amount * 100) : undefined,
      });
      
      if (response.Success) {
        await TransactionRepository.updateByPaymentId(paymentId, {
          status: 'cancelled',
          providerStatus: response.Status,
        });
      }
      
      return response.Success;
      
    } catch {
      return false;
    }
  }
  
  /**
   * Маппинг статуса провайдера на внутренний статус
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
  
  /**
   * Форматирование описания заказа
   */
  private static formatDescription(productNames: string[]): string {
    if (productNames.length === 0) return 'Оплата заказа';
    if (productNames.length === 1) return productNames[0];
    
    const maxLength = 140; // Ограничение API
    let description = productNames.join(', ');
    
    if (description.length > maxLength) {
      description = `${productNames[0]} и ещё ${productNames.length - 1} товар(ов)`;
    }
    
    return description.slice(0, maxLength);
  }
  
  /**
   * Расчет срока жизни ссылки/QR
   * Формат: YYYY-MM-DDTHH24:MI:SS+03:00
   */
  private static getRedirectDueDate(): string {
    const date = new Date();
    date.setMinutes(date.getMinutes() + TBANK_CONFIG.QR_LIFETIME_MINUTES);
    
    // Форматируем в нужный формат для API Тбанк
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+03:00`;
  }
}
