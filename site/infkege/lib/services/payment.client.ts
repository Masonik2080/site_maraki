// lib/services/payment.client.ts
// Клиентский сервис для работы с платежами
'use client';

// Локальный тип для клиентской стороны
type PaymentMethod = 'sbp' | 'card' | 'tpay';

interface CreatePaymentResponse {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  qrPayload?: string;
  paymentMethod?: PaymentMethod;
  error?: string;
  errorCode?: string;
}

interface PaymentStatusResponse {
  success: boolean;
  status?: string;
  transactionStatus?: string;
  isPaid?: boolean;
  orderId?: string;
  error?: string;
}

export class PaymentClientService {
  
  /**
   * Создание платежа
   */
  static async createPayment(
    orderId: string,
    paymentMethod: PaymentMethod
  ): Promise<CreatePaymentResponse> {
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentMethod }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Ошибка создания платежа',
          errorCode: data.errorCode,
        };
      }
      
      return data;
      
    } catch (error) {
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  }
  
  /**
   * Проверка статуса платежа
   */
  static async checkStatus(paymentId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await fetch(`/api/payment/status?paymentId=${paymentId}`);
      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Ошибка проверки статуса',
        };
      }
      
      return data;
      
    } catch (error) {
      return {
        success: false,
        error: 'Ошибка сети',
      };
    }
  }
  
  /**
   * Поллинг статуса платежа
   */
  static async pollStatus(
    paymentId: string,
    options: {
      intervalMs?: number;
      maxAttempts?: number;
      onStatusChange?: (status: string) => void;
    } = {}
  ): Promise<PaymentStatusResponse> {
    const {
      intervalMs = 3000,
      maxAttempts = 100,
      onStatusChange,
    } = options;
    
    let attempts = 0;
    
    return new Promise((resolve) => {
      const checkStatus = async () => {
        attempts++;
        
        const result = await this.checkStatus(paymentId);
        
        if (result.success && onStatusChange && result.status) {
          onStatusChange(result.status);
        }
        
        // Если оплачено или ошибка — завершаем
        if (result.isPaid) {
          resolve(result);
          return;
        }
        
        // Если статус финальный (ошибка/отмена) — завершаем
        const finalStatuses = ['REJECTED', 'AUTH_FAIL', 'CANCELED', 'DEADLINE_EXPIRED'];
        if (result.status && finalStatuses.includes(result.status)) {
          resolve(result);
          return;
        }
        
        // Если превышено количество попыток
        if (attempts >= maxAttempts) {
          resolve({
            success: false,
            error: 'Превышено время ожидания оплаты',
          });
          return;
        }
        
        // Продолжаем поллинг
        setTimeout(checkStatus, intervalMs);
      };
      
      checkStatus();
    });
  }
  
  /**
   * Генерация QR-кода из payload
   */
  static generateQrDataUrl(payload: string): string {
    // Используем внешний сервис для генерации QR
    // В продакшене лучше использовать библиотеку типа qrcode
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(payload)}`;
  }
}
