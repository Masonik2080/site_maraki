'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Clock, CheckCircle, XCircle, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

// Dynamic import - jsPDF + html2canvas are heavy (~500KB combined)
const DownloadReceiptButton = dynamic(
  () => import('./download-receipt-button').then((mod) => mod.DownloadReceiptButton),
  {
    loading: () => <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />,
    ssr: false, // Only needed on client
  }
);

interface OrderItem {
  id: string;
  productTitle: string;
  productType: string;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  items: OrderItem[];
  formattedDate: string; // Pre-formatted on server to avoid hydration mismatch
}

interface OrdersListProps {
  orders: Order[];
}

// Improved contrast for accessibility (WCAG AA compliance)
const STATUS_MAP: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  completed: { label: 'Оплачен', color: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  authorized: { label: 'Оплачен', color: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle },
  awaiting_payment: { label: 'Ожидает', color: 'text-amber-700 dark:text-amber-400', icon: Clock },
  processing: { label: 'Обработка', color: 'text-blue-700 dark:text-blue-400', icon: Clock },
  cancelled: { label: 'Отменён', color: 'text-red-700 dark:text-red-400', icon: XCircle },
  failed: { label: 'Ошибка', color: 'text-red-700 dark:text-red-400', icon: XCircle },
  refunded: { label: 'Возврат', color: 'text-zinc-600 dark:text-zinc-400', icon: XCircle },
};

const ITEMS_PER_PAGE = 6;

export function OrdersList({ orders }: OrdersListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  const totalPages = Math.ceil(orders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = orders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  const showPagination = orders.length > ITEMS_PER_PAGE;
  return (
    <div className="border border-border-main rounded-xl overflow-hidden bg-[--color-page-bg]">
      {/* Table Header - Desktop */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 px-4 py-2.5 bg-[--color-zinc-50] border-b border-border-main text-xs font-medium text-text-secondary uppercase tracking-wide">
        <div>Заказ</div>
        <div className="w-24 text-center">Статус</div>
        <div className="w-24 text-right">Сумма</div>
        <div className="w-20 text-center">Чек</div>
      </div>

      {/* Orders List */}
      <div className="divide-y divide-border-main">
        {paginatedOrders.map((order) => {
          const status = STATUS_MAP[order.status] || STATUS_MAP.awaiting_payment;
          const StatusIcon = status.icon;
          const orderNumber = order.id.split('-')[0].toUpperCase();
          const isPaid = order.status === 'completed' || order.status === 'authorized';

          return (
            <div
              key={order.id}
              className="px-4 py-3 hover:bg-[--color-zinc-50] transition-colors"
            >
              {/* Desktop Layout */}
              <div className="hidden sm:grid sm:grid-cols-[1fr_auto_auto_auto] gap-4 items-center">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">#{orderNumber}</span>
                    <span className="text-xs text-text-secondary/80">{order.formattedDate}</span>
                  </div>
                  <p className="text-xs text-text-secondary/70 truncate mt-0.5">
                    {order.items.map((i) => i.productTitle).join(', ')}
                  </p>
                </div>

                <div className="w-24 flex justify-center">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </span>
                </div>

                <div className="w-24 text-right">
                  <span className="font-medium text-text-primary text-sm">
                    {order.total.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                <div className="w-20 flex justify-center">
                  {isPaid ? (
                    <DownloadReceiptButton
                      orderId={order.id}
                      orderNumber={orderNumber}
                      className="p-1.5 text-text-secondary hover:text-action hover:bg-action/10 rounded-lg transition-colors"
                    />
                  ) : (
                    <span className="text-text-secondary/25">—</span>
                  )}
                </div>
              </div>

              {/* Mobile Layout */}
              <div className="sm:hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-text-primary text-sm">#{orderNumber}</span>
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary/80 mt-1">{order.formattedDate}</p>
                    <p className="text-xs text-text-secondary/70 truncate mt-0.5">
                      {order.items.map((i) => i.productTitle).join(', ')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-medium text-text-primary text-sm">
                      {order.total.toLocaleString('ru-RU')} ₽
                    </span>
                    {isPaid && (
                      <DownloadReceiptButton
                        orderId={order.id}
                        orderNumber={orderNumber}
                        className="flex items-center gap-1 text-xs text-action mt-1 justify-end"
                        showText
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className="flex items-center justify-center px-4 py-3 border-t border-border-main bg-[--color-zinc-50]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-[--color-zinc-100] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Предыдущая страница"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-medium transition-colors ${
                  page === currentPage
                    ? 'bg-action text-white'
                    : 'text-text-secondary hover:text-text-primary hover:bg-[--color-zinc-100]'
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-[--color-zinc-100] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Следующая страница"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
