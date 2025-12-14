# Система оплаты Тбанк

Модуль интеграции с платежной системой Т-Банк (Тинькофф) с поддержкой СБП (QR-код), оплаты картой и T-Pay.

## Архитектура

```
lib/payment/
├── types.ts              # Типы и интерфейсы
├── config.ts             # Конфигурация и константы
├── token.ts              # Генерация токена подписи
├── api-client.ts         # HTTP клиент для API Тбанк
├── payment.service.ts    # Основной сервис (server-side)
├── transaction.repository.ts  # Репозиторий транзакций
├── webhook.handler.ts    # Обработчик вебхуков
├── migrations.sql        # SQL миграции
└── index.ts              # Экспорты
```

## Способы оплаты

1. **СБП (QR-код)** — рекомендуемый, минимальная сумма 10₽
2. **Банковская карта** — редирект на платежную форму Тбанк
3. **T-Pay** — быстрая оплата через приложение Т-Банк

## Настройка

### 1. Переменные окружения

```env
TINKOFF_TERMINAL_KEY=your_terminal_key
TINKOFF_SECRET_KEY=your_secret_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 2. Миграции БД

Выполните SQL из `migrations.sql` в Supabase SQL Editor.

## API Endpoints

### POST /api/payment/create
Создание платежа.

**Request:**
```json
{
  "orderId": "uuid",
  "paymentMethod": "sbp" | "card" | "tpay"
}
```

**Response (СБП):**
```json
{
  "success": true,
  "paymentId": "123456",
  "qrPayload": "https://qr.nspk.ru/..."
}
```

**Response (Карта/T-Pay):**
```json
{
  "success": true,
  "paymentId": "123456",
  "paymentUrl": "https://securepay.tinkoff.ru/..."
}
```

### GET /api/payment/status?paymentId=xxx
Проверка статуса платежа.

**Response:**
```json
{
  "success": true,
  "status": "CONFIRMED",
  "transactionStatus": "completed",
  "isPaid": true
}
```

### POST /api/payment/webhook
Вебхук от Тбанк (автоматически).

## Компоненты

### CheckoutForm
Основная форма оформления заказа с выбором способа оплаты.

```tsx
import { CheckoutForm } from '@/components/checkout';

<CheckoutForm cart={cartData} />
```

### PaymentMethodSelector
Выбор способа оплаты.

```tsx
import { PaymentMethodSelector } from '@/components/checkout';

<PaymentMethodSelector
  selected={paymentMethod}
  onChange={setPaymentMethod}
/>
```

### QrPaymentModal
Модальное окно с QR-кодом для СБП.

```tsx
import { QrPaymentModal } from '@/components/checkout';

<QrPaymentModal
  isOpen={showModal}
  onClose={handleClose}
  onSuccess={handleSuccess}
  paymentId={paymentId}
  qrPayload={qrPayload}
  amount={1000}
/>
```

## Клиентский сервис

```typescript
import { PaymentClientService } from '@/lib/services/payment.client';

// Создание платежа
const result = await PaymentClientService.createPayment(orderId, 'sbp');

// Проверка статуса
const status = await PaymentClientService.checkStatus(paymentId);

// Поллинг статуса
const finalStatus = await PaymentClientService.pollStatus(paymentId, {
  intervalMs: 3000,
  maxAttempts: 100,
  onStatusChange: (status) => console.log(status),
});
```

## Серверный сервис

```typescript
import { PaymentService, TransactionRepository } from '@/lib/payment';

// Создание платежа
const result = await PaymentService.createPayment({
  orderId: 'uuid',
  userId: 'uuid',
  amount: 1000,
  description: 'Описание',
  productNames: ['Товар 1', 'Товар 2'],
  paymentMethod: 'sbp',
});

// Проверка статуса
const status = await PaymentService.checkPaymentStatus(paymentId);

// Отмена платежа
const cancelled = await PaymentService.cancelPayment(paymentId);
```

## Статусы платежа

| Статус Тбанк | Внутренний статус | Описание |
|--------------|-------------------|----------|
| NEW | pending | Платеж создан |
| FORM_SHOWED | pending | Форма показана |
| AUTHORIZING | processing | Авторизация |
| CONFIRMING | processing | Подтверждение |
| AUTHORIZED | completed | Авторизован (двухстадийный) |
| CONFIRMED | completed | Подтвержден (оплачен) |
| CANCELED | cancelled | Отменен |
| REVERSED | cancelled | Возвращен |
| REJECTED | failed | Отклонен |
| AUTH_FAIL | failed | Ошибка авторизации |

## Логирование

Все события платежей логируются в:
- `transactions` — основная таблица транзакций
- `payment_logs` — детальный аудит (если создана таблица)
- `access_log` — выдача доступа после оплаты

## Безопасность

1. Все запросы подписываются токеном (SHA-256)
2. Вебхуки верифицируются по токену
3. Проверка владельца заказа перед операциями
4. RLS политики на таблицах БД
5. Секретные ключи только на сервере

## Тестирование

Для тестирования используйте тестовый терминал Тбанк:
- API URL: `https://rest-api-test.tinkoff.ru/v2`
- Тестовые карты: см. документацию Тбанк
