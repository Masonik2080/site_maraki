"use client";

import { UserOrder } from "@/lib/services/users.client";
import { cn } from "@/lib/utils";

interface UserOrdersTabProps {
  orders: UserOrder[];
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  completed: { label: "Оплачен", color: "bg-green-100 text-green-700" },
  awaiting_payment: { label: "Ожидает", color: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Отменён", color: "bg-red-100 text-red-700" },
  refunded: { label: "Возврат", color: "bg-gray-100 text-gray-600" },
};

export function UserOrdersTab({ orders }: UserOrdersTabProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ru-RU").format(amount) + " ₽";
  };

  if (orders.length === 0) {
    return <p className="text-center text-sm text-[--color-text-secondary] py-8">Нет заказов</p>;
  }

  return (
    <div className="space-y-2">
      {orders.map((order) => {
        const status = STATUS_MAP[order.status] || { label: order.status, color: "bg-gray-100" };
        return (
          <div key={order.id} className="p-3 bg-[--color-bg-secondary] rounded-lg">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-mono text-[--color-text-secondary]">
                #{order.id.slice(0, 8)}
              </span>
              <span className={cn("px-2 py-0.5 text-xs rounded-full", status.color)}>
                {status.label}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[--color-text-secondary]">
                {formatDate(order.createdAt)} · {order.itemsCount} шт.
              </span>
              <span className="font-medium text-[--color-text-primary]">
                {formatCurrency(order.total)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
