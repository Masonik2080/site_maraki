// lib/payment/config.ts
// Конфигурация платежной системы

export const TBANK_CONFIG = {
  // API URL — всегда один и тот же, режим определяется терминалом
  API_URL: 'https://securepay.tinkoff.ru/v2',
  
  // Endpoints
  ENDPOINTS: {
    INIT: '/Init',
    GET_QR: '/GetQr',
    GET_STATE: '/GetState',
    CANCEL: '/Cancel',
    CONFIRM: '/Confirm',
  },
  
  // Timeouts
  QR_LIFETIME_MINUTES: 15,
  PAYMENT_CHECK_INTERVAL_MS: 3000,
  MAX_PAYMENT_CHECK_ATTEMPTS: 100,
  
  // Минимальная сумма для СБП (в копейках)
  MIN_SBP_AMOUNT: 1000, // 10 рублей
} as const;

export const PAYMENT_METHODS = {
  sbp: {
    id: 'sbp',
    name: 'СБП (QR-код)',
    description: 'Оплата через Систему быстрых платежей',
    icon: 'qr-code',
    recommended: true,
    minAmount: 1000, // 10 рублей в копейках
  },
  card: {
    id: 'card',
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР',
    icon: 'credit-card',
    recommended: false,
    minAmount: 100, // 1 рубль в копейках
  },
  tpay: {
    id: 'tpay',
    name: 'T-Pay',
    description: 'Быстрая оплата через Т-Банк',
    icon: 'smartphone',
    recommended: false,
    minAmount: 100,
  },
} as const;

export function getApiUrl(): string {
  // API URL всегда один — режим (тест/прод) определяется терминалом
  return TBANK_CONFIG.API_URL;
}

export function getTerminalKey(): string {
  const key = process.env.TINKOFF_TERMINAL_KEY;
  if (!key) throw new Error('TINKOFF_TERMINAL_KEY not configured');
  return key;
}

export function getSecretKey(): string {
  const key = process.env.TINKOFF_SECRET_KEY;
  if (!key) throw new Error('TINKOFF_SECRET_KEY not configured');
  return key;
}
