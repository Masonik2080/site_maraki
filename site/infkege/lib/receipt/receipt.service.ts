// lib/receipt/receipt.service.ts
// Сервис генерации PDF чеков — server-side only
import 'server-only';
import type { Order } from '@/lib/dao/types';
import type { UserProfile } from '@/lib/dao/types';

interface ReceiptData {
  order: Order;
  user: UserProfile;
  companyInfo: {
    name: string;
    inn: string;
    address: string;
    email: string;
    phone: string;
  };
}

/**
 * Генерация PDF чека
 * Используем простой HTML -> PDF подход через браузерный API
 * Для production рекомендуется использовать puppeteer или @react-pdf/renderer
 */
export class ReceiptService {
  
  private static readonly COMPANY_INFO = {
    name: 'ИП Иванов Иван Иванович',
    inn: '123456789012',
    address: 'г. Москва, ул. Примерная, д. 1',
    email: 'support@infkege.ru',
    phone: '+7 (999) 123-45-67',
  };

  /**
   * Генерация HTML чека для конвертации в PDF
   */
  static generateReceiptHtml(data: ReceiptData): string {
    const { order, user, companyInfo } = data;
    const orderNumber = order.id.split('-')[0].toUpperCase();
    const orderDate = order.paidAt || order.createdAt;
    const formattedDate = orderDate.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedTime = orderDate.toLocaleTimeString('ru-RU', {
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
      max-width: 600px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      padding-bottom: 24px;
      border-bottom: 1px solid #e5e5e5;
      margin-bottom: 24px;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 4px;
    }
    .subtitle {
      color: #666;
      font-size: 11px;
    }
    .receipt-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .receipt-meta {
      color: #666;
      font-size: 11px;
    }
    .section {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      margin-bottom: 8px;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .info-label {
      color: #666;
    }
    .info-value {
      font-weight: 500;
      text-align: right;
    }
    .items-table {
      width: 100%;
      border-collapse: collapse;
    }
    .items-table th {
      text-align: left;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #666;
      padding: 8px 0;
      border-bottom: 1px solid #e5e5e5;
    }
    .items-table th:last-child {
      text-align: right;
    }
    .items-table td {
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: top;
    }
    .items-table td:last-child {
      text-align: right;
      white-space: nowrap;
    }
    .item-title {
      font-weight: 500;
    }
    .item-type {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }
    .totals {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 2px solid #1a1a1a;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
    }
    .total-row.main {
      font-size: 16px;
      font-weight: 700;
      padding: 8px 0;
    }
    .footer {
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid #e5e5e5;
      text-align: center;
    }
    .company-info {
      font-size: 10px;
      color: #666;
      line-height: 1.6;
    }
    .legal-note {
      margin-top: 16px;
      padding: 12px;
      background: #f8f8f8;
      border-radius: 6px;
      font-size: 10px;
      color: #666;
    }
    .stamp {
      margin-top: 24px;
      padding: 16px;
      border: 2px solid #22c55e;
      border-radius: 8px;
      text-align: center;
    }
    .stamp-text {
      color: #22c55e;
      font-weight: 700;
      font-size: 14px;
    }
    .stamp-date {
      color: #666;
      font-size: 10px;
      margin-top: 4px;
    }
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

  <div class="section">
    <div class="section-title">Покупатель</div>
    <div class="info-row">
      <span class="info-label">ФИО</span>
      <span class="info-value">${user.fullName || 'Не указано'}</span>
    </div>
    <div class="info-row">
      <span class="info-label">Email</span>
      <span class="info-value">${user.email || '—'}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Товары и услуги</div>
    <table class="items-table">
      <thead>
        <tr>
          <th>Наименование</th>
          <th>Сумма</th>
        </tr>
      </thead>
      <tbody>
        ${order.items.map(item => `
          <tr>
            <td>
              <div class="item-title">${item.productTitle}</div>
              <div class="item-type">${this.getProductTypeLabel(item.productType)}</div>
            </td>
            <td>${item.priceAtPurchase.toLocaleString('ru-RU')} ₽</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="totals">
      ${order.discount > 0 ? `
        <div class="total-row">
          <span>Подытог</span>
          <span>${order.subtotal.toLocaleString('ru-RU')} ₽</span>
        </div>
        <div class="total-row">
          <span>Скидка</span>
          <span>−${order.discount.toLocaleString('ru-RU')} ₽</span>
        </div>
      ` : ''}
      <div class="total-row main">
        <span>Итого</span>
        <span>${order.total.toLocaleString('ru-RU')} ₽</span>
      </div>
    </div>
  </div>

  <div class="stamp">
    <div class="stamp-text">✓ ОПЛАЧЕНО</div>
    <div class="stamp-date">${formattedDate}</div>
  </div>

  <div class="footer">
    <div class="company-info">
      <strong>${companyInfo.name}</strong><br>
      ИНН: ${companyInfo.inn}<br>
      ${companyInfo.address}<br>
      ${companyInfo.email} | ${companyInfo.phone}
    </div>
    
    <div class="legal-note">
      Настоящий документ подтверждает оказание образовательных услуг 
      в соответствии с договором публичной оферты. 
      Чек сформирован автоматически и действителен без подписи и печати.
    </div>
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Получение данных для чека
   */
  static getReceiptData(order: Order, user: UserProfile): ReceiptData {
    return {
      order,
      user,
      companyInfo: this.COMPANY_INFO,
    };
  }

  /**
   * Название типа продукта
   */
  private static getProductTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      course: 'Образовательный курс',
      variant_pack: 'Пакет вариантов ЕГЭ',
      package: 'Пакет материалов',
      consultation: 'Консультация',
    };
    return labels[type] || 'Образовательные услуги';
  }
}
