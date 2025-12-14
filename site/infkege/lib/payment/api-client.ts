// lib/payment/api-client.ts
// HTTP клиент для API Тбанк
import { getApiUrl, TBANK_CONFIG } from './config';
import type {
  TbankInitRequest,
  TbankInitResponse,
  TbankGetQrRequest,
  TbankGetQrResponse,
  TbankGetStateRequest,
  TbankGetStateResponse,
  TbankCancelRequest,
  TbankCancelResponse,
} from './types';

class TbankApiError extends Error {
  constructor(
    message: string,
    public errorCode: string,
    public details?: string
  ) {
    super(message);
    this.name = 'TbankApiError';
  }
}

async function makeRequest<TRequest, TResponse>(
  endpoint: string,
  data: TRequest
): Promise<TResponse> {
  const url = `${getApiUrl()}${endpoint}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new TbankApiError(
      `HTTP error: ${response.status}`,
      'HTTP_ERROR',
      await response.text()
    );
  }
  
  const result = await response.json() as TResponse & { 
    Success: boolean; 
    ErrorCode: string;
    Message?: string;
    Details?: string;
  };
  
  console.log(`[TbankAPI] ${endpoint} response:`, {
    Success: result.Success,
    ErrorCode: result.ErrorCode,
    Message: result.Message,
  });
  
  // API возвращает Success: true и ErrorCode: "0" при успехе
  // Выбрасываем ошибку если Success: false или ErrorCode не "0"
  if (!result.Success || (result.ErrorCode && result.ErrorCode !== '0')) {
    throw new TbankApiError(
      result.Message || 'Unknown API error',
      result.ErrorCode || 'UNKNOWN',
      result.Details
    );
  }
  
  return result;
}

/**
 * Инициализация платежа
 */
export async function initPayment(
  data: TbankInitRequest
): Promise<TbankInitResponse> {
  return makeRequest<TbankInitRequest, TbankInitResponse>(
    TBANK_CONFIG.ENDPOINTS.INIT,
    data
  );
}

/**
 * Получение QR-кода для СБП
 */
export async function getQr(
  data: TbankGetQrRequest
): Promise<TbankGetQrResponse> {
  return makeRequest<TbankGetQrRequest, TbankGetQrResponse>(
    TBANK_CONFIG.ENDPOINTS.GET_QR,
    data
  );
}

/**
 * Получение статуса платежа
 */
export async function getPaymentState(
  data: TbankGetStateRequest
): Promise<TbankGetStateResponse> {
  return makeRequest<TbankGetStateRequest, TbankGetStateResponse>(
    TBANK_CONFIG.ENDPOINTS.GET_STATE,
    data
  );
}

/**
 * Отмена/возврат платежа
 */
export async function cancelPayment(
  data: TbankCancelRequest
): Promise<TbankCancelResponse> {
  return makeRequest<TbankCancelRequest, TbankCancelResponse>(
    TBANK_CONFIG.ENDPOINTS.CANCEL,
    data
  );
}

export { TbankApiError };
