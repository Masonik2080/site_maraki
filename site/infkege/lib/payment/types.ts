// lib/payment/types.ts
// Типы для платежной системы Тбанк

// ============ PAYMENT METHODS ============
export type PaymentMethod = 'sbp' | 'card' | 'tpay';

export type PaymentStatus = 
  | 'NEW'
  | 'FORM_SHOWED'
  | 'AUTHORIZING'
  | 'AUTHORIZED'
  | 'CONFIRMING'
  | 'CONFIRMED'
  | 'REVERSING'
  | 'REVERSED'
  | 'REFUNDING'
  | 'PARTIAL_REFUNDED'
  | 'REFUNDED'
  | 'CANCELED'
  | 'DEADLINE_EXPIRED'
  | 'REJECTED'
  | 'AUTH_FAIL';

export type TransactionStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'refunded';

// ============ TBANK API TYPES ============
export interface TbankInitRequest {
  TerminalKey: string;
  Amount: number;
  OrderId: string;
  Description: string;
  Token: string;
  PayType?: 'O' | 'T';
  Language?: 'ru' | 'en';
  NotificationURL?: string;
  SuccessURL?: string;
  FailURL?: string;
  RedirectDueDate?: string;
  CustomerKey?: string;
  DATA?: Record<string, string>;
}

export interface TbankInitResponse {
  Success: boolean;
  ErrorCode: string;
  TerminalKey: string;
  Status: PaymentStatus;
  PaymentId: string;
  OrderId: string;
  Amount: number;
  PaymentURL?: string;
  Message?: string;
  Details?: string;
}

export interface TbankGetQrRequest {
  TerminalKey: string;
  PaymentId: number;
  DataType?: 'PAYLOAD' | 'IMAGE';
  Token: string;
}

export interface TbankGetQrResponse {
  Success: boolean;
  ErrorCode: string;
  TerminalKey: string;
  OrderId: string;
  Data: string; // QR payload или SVG
  PaymentId: number;
  Message?: string;
  Details?: string;
}

export interface TbankGetStateRequest {
  TerminalKey: string;
  PaymentId: string;
  Token: string;
}

export interface TbankGetStateResponse {
  Success: boolean;
  ErrorCode: string;
  Message?: string;
  TerminalKey: string;
  Status: PaymentStatus;
  PaymentId: string;
  OrderId: string;
  Amount: number;
}

export interface TbankCancelRequest {
  TerminalKey: string;
  PaymentId: string;
  Token: string;
  Amount?: number;
}

export interface TbankCancelResponse {
  Success: boolean;
  ErrorCode: string;
  TerminalKey: string;
  OrderId: string;
  Status: PaymentStatus;
  OriginalAmount: number;
  NewAmount: number;
  PaymentId: string;
  Message?: string;
}

export interface TbankNotification {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: PaymentStatus;
  PaymentId: number;
  ErrorCode: string;
  Amount: number;
  CardId?: number;
  Pan?: string;
  ExpDate?: string;
  Token: string;
}

// ============ INTERNAL TYPES ============
export interface CreatePaymentInput {
  orderId: string;
  userId: string;
  amount: number;
  description: string;
  productNames: string[];
  paymentMethod: PaymentMethod;
  customerEmail?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  paymentUrl?: string;
  qrData?: string;
  qrPayload?: string;
  error?: string;
  errorCode?: string;
}

export interface PaymentStatusResult {
  success: boolean;
  status?: PaymentStatus;
  transactionStatus?: TransactionStatus;
  isPaid?: boolean;
  error?: string;
}

// ============ TRANSACTION LOG ============
export interface TransactionLog {
  id: string;
  orderId: string;
  userId: string;
  providerPaymentId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  currency: string;
  status: TransactionStatus;
  providerStatus?: PaymentStatus;
  productNames: string[];
  errorMessage?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}
