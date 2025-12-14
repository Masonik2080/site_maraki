// app/dashboard/purchases/page.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthRepository, OrderRepository } from '@/lib/dao';
import { ShoppingBag, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Lazy load OrdersList - it's a client component with heavy dependencies
const OrdersList = dynamic(
  () => import('@/components/dashboard/orders-list').then((mod) => mod.OrdersList),
  { ssr: true }
);

export const metadata = {
  title: 'История покупок — InfKege',
  description: 'Просмотр истории заказов и скачивание чеков. Личный кабинет InfKege.',
  robots: {
    index: false, // Dashboard pages should not be indexed
    follow: false,
  },
};

// Skeleton for orders list
function OrdersSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-[--color-page-bg] border border-border-main rounded-xl p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-4 w-28 bg-[--color-zinc-200] rounded" />
            <div className="h-4 w-16 bg-[--color-zinc-100] rounded" />
          </div>
          <div className="h-3.5 w-40 bg-[--color-zinc-100] rounded mb-1.5" />
          <div className="h-3.5 w-20 bg-[--color-zinc-100] rounded" />
        </div>
      ))}
    </div>
  );
}

// Async component that fetches orders
async function OrdersContent({ userId }: { userId: string }) {
  const orders = await OrderRepository.getUserOrders(userId);

  if (orders.length === 0) {
    return (
      <div className="text-center py-14 border border-dashed border-border-main rounded-xl">
        <FileText className="w-9 h-9 text-text-secondary/40 mx-auto mb-3" />
        <h3 className="font-medium text-text-primary text-sm mb-1">Нет покупок</h3>
        <p className="text-sm text-text-secondary mb-4">
          История заказов появится после первой покупки
        </p>
        <Button asChild className="h-9 px-4 text-sm">
          <Link href="/shop">
            <ShoppingBag className="w-4 h-4 mr-1.5" />В магазин
          </Link>
        </Button>
      </div>
    );
  }

  // Сериализуем для клиентского компонента
  const months = ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сен.', 'окт.', 'ноя.', 'дек.'];
  
  const serializedOrders = orders.map((order) => {
    const d = order.createdAt;
    const formattedDate = `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()} г.`;
    
    return {
      id: order.id,
      status: order.status,
      total: order.total,
      items: order.items.map((item) => ({
        id: item.id,
        productTitle: item.productTitle,
        productType: item.productType,
        priceAtPurchase: item.priceAtPurchase,
      })),
      formattedDate,
    };
  });

  return <OrdersList orders={serializedOrders} />;
}

export default async function PurchasesPage() {
  // getCurrentUser already calls connection() internally
  const user = await AuthRepository.getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/dashboard/purchases');
  }

  return (
    <div className="layout-container py-8 min-h-[80vh]">
      {/* Header */}
      <h1 className="text-xl font-semibold text-text-primary mb-6">Личный кабинет</h1>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-main mb-6">
        <Link
          href="/dashboard"
          className="pb-2.5 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          Мои курсы
        </Link>
        <Link
          href="/dashboard/purchases"
          className="pb-2.5 border-b-2 border-action text-action font-medium text-sm"
        >
          История покупок
        </Link>
        <Link
          href="/dashboard/settings"
          className="pb-2.5 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          Настройки
        </Link>
      </div>

      {/* Orders - streamed with Suspense */}
      <Suspense fallback={<OrdersSkeleton />}>
        <OrdersContent userId={user.id} />
      </Suspense>
    </div>
  );
}
