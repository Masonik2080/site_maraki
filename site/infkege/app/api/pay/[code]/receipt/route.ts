// app/api/pay/[code]/receipt/route.ts
// API для генерации чека по платёжной ссылке
import { NextRequest, NextResponse } from 'next/server';
import { PaymentLinkRepository } from '@/lib/dao/payment-link.repository';

interface RouteParams {
  params: Promise<{ code: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const { code } = await params;
  const { searchParams } = new URL(request.url);
  const paymentId = searchParams.get('paymentId');
  
  // Валидация paymentId (UUID формат)
  if (!paymentId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(paymentId)) {
    return NextResponse.json({ error: 'Invalid paymentId' }, { status: 400 });
  }
  
  // Валидация кода
  const sanitizedCode = String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 32);
  if (!sanitizedCode) {
    return NextResponse.json({ error: 'Invalid code' }, { status: 400 });
  }
  
  // Получаем ссылку
  const link = await PaymentLinkRepository.getByCode(sanitizedCode);
  if (!link) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 });
  }
  
  // Получаем платёж
  const payment = await PaymentLinkRepository.getPaymentById(paymentId);
  
  // ВАЖНО: Проверяем что платёж принадлежит этой ссылке!
  if (!payment || payment.linkId !== link.id) {
    return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
  }
  
  if (payment.status !== 'completed') {
    return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
  }
  
  // Генерируем HTML чека
  const receiptHtml = generateReceiptHtml(link, payment);
  
  return new NextResponse(receiptHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

function generateReceiptHtml(
  link: { amount: number; description: string; code: string },
  payment: { id: string; contactInfo: string | null; paidAt: Date | null; paymentMethod: string | null }
): string {
  const orderNumber = payment.id.split('-')[0].toUpperCase();
  const paidDate = payment.paidAt || new Date();
  const formattedDate = paidDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = paidDate.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Чек №${orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1a1a1a;
      background: #fff;
      padding: 32px;
      max-width: 500px;
      margin: 0 auto;
    }
    .header { text-align: center; padding-bottom: 24px; border-bottom: 1px solid #e5e5e5; margin-bottom: 24px; }
    .logo { font-size: 24px; font-weight: 700; color: #2563eb; margin-bottom: 4px; }
    .subtitle { color: #666; font-size: 11px; }
    .receipt-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
    .receipt-meta { color: #666; font-size: 11px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #666; margin-bottom: 8px; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; }
    .info-label { color: #666; }
    .info-value { font-weight: 500; text-align: right; }
    .total { font-size: 18px; font-weight: 700; text-align: center; padding: 16px; background: #f8f8f8; border-radius: 8px; margin: 16px 0; }
    .stamp { margin-top: 24px; padding: 16px; border: 2px solid #22c55e; border-radius: 8px; text-align: center; }
    .stamp-text { color: #22c55e; font-weight: 700; font-size: 14px; }
    .stamp-date { color: #666; font-size: 10px; margin-top: 4px; }
    .footer { margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e5e5; text-align: center; }
    .legal-note { margin-top: 16px; padding: 12px; background: #f8f8f8; border-radius: 6px; font-size: 10px; color: #666; }
    @media print { body { padding: 0; } .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">InfKege</div>
    <div class="subtitle">Образовательная платформа</div>
  </div>

  <div class="section">
    <div class="receipt-title">Кассовый чек №${orderNumber}</div>
    <div class="receipt-meta">${formattedDate} в ${formattedTime}</div>
  </div>

  ${payment.contactInfo ? `
  <div class="section">
    <div class="section-title">Покупатель</div>
    <div class="info-row">
      <span class="info-label">Контакт</span>
      <span class="info-value">${payment.contactInfo}</span>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <div class="section-title">Услуга</div>
    <div class="info-row">
      <span class="info-label">Наименование</span>
      <span class="info-value">${link.description}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Способ оплаты</span>
      <span class="info-value">${payment.paymentMethod?.toUpperCase() || 'Онлайн'}</span>
    </div>
  </div>

  <div class="total">
    Итого: ${link.amount.toLocaleString('ru-RU')} ₽
  </div>

  <div class="stamp">
    <div class="stamp-text">✓ ОПЛАЧЕНО</div>
    <div class="stamp-date">${formattedDate}</div>
  </div>

  <div class="footer">
    <div class="legal-note">
      Настоящий документ подтверждает оплату услуги в соответствии с договором публичной оферты.
      Чек сформирован автоматически и действителен без подписи и печати.
    </div>
  </div>

  <div class="no-print" style="text-align: center; margin-top: 24px;">
    <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px;">
      Распечатать / Сохранить PDF
    </button>
  </div>
</body>
</html>
  `.trim();
}
