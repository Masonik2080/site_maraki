// app/checkout/success/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthRepository, OrderRepository } from '@/lib/dao';
import { CheckCircle, ArrowRight, ShoppingBag, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Оплата успешна — InfKege',
};

interface SuccessPageProps {
  searchParams: Promise<{ orderId?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const params = await searchParams;
  const user = await AuthRepository.getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }
  
  // Получаем информацию о заказе
  let order = null;
  if (params.orderId) {
    order = await OrderRepository.getOrderById(params.orderId);
    
    // Проверяем, что заказ принадлежит пользователю
    if (order && order.userId !== user.id) {
      order = null;
    }
  }
  
  const orderNumber = order?.id.split('-')[0].toUpperCase();
  
  return (
    <div className="layout-container py-12 min-h-[80vh]">
      <div className="max-w-md mx-auto text-center">
        {/* Success icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          Оплата прошла успешно!
        </h1>
        
        <p className="text-text-secondary mb-6">
          Спасибо за покупку. Доступ к материалам уже открыт.
        </p>
        
        {/* Order info */}
        {order && (
          <div className="bg-[--color-page-bg] border border-border-main rounded-xl p-5 mb-6 text-left">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-text-primary text-sm">
                Заказ #{orderNumber}
              </h2>
              <span className="text-lg font-bold text-text-primary">
                {order.total.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-text-secondary shrink-0" />
                  <span className="text-text-primary truncate">{item.productTitle}</span>
                </div>
              ))}
            </div>
            
            {/* Download receipt */}
            <Link
              href={`/api/receipt/${order.id}`}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-2.5 px-4 border border-border-main rounded-lg text-sm font-medium text-text-primary hover:bg-[--color-zinc-50] transition-colors"
            >
              <Download className="w-4 h-4" />
              Скачать чек
            </Link>
            
            <p className="text-xs text-text-secondary text-center mt-3">
              Чек всегда доступен в разделе «История покупок»
            </p>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button asChild className="h-11">
            <Link href="/dashboard">
              Перейти к курсам
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="h-11">
            <Link href="/shop">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Продолжить покупки
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
