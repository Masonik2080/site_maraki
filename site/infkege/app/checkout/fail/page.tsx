// app/checkout/fail/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthRepository, OrderRepository } from '@/lib/dao';
import { XCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Ошибка оплаты — InfKege',
};

interface FailPageProps {
  searchParams: Promise<{ orderId?: string; error?: string }>;
}

export default async function CheckoutFailPage({ searchParams }: FailPageProps) {
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
  
  return (
    <div className="layout-container py-16 min-h-[80vh]">
      <div className="max-w-lg mx-auto text-center">
        {/* Error icon */}
        <div className="w-24 h-24 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-8">
          <XCircle className="w-12 h-12 text-red-500" />
        </div>
        
        <h1 className="text-3xl font-bold text-text-primary mb-3">
          Оплата не прошла
        </h1>
        
        <p className="text-text-secondary text-lg mb-8">
          К сожалению, платёж не был завершён. Попробуйте ещё раз или выберите другой способ оплаты.
        </p>
        
        {/* Order info */}
        {order && (
          <div className="bg-[--color-page-bg] border border-border-main rounded-2xl p-6 mb-8 text-left">
            <h2 className="font-semibold text-text-primary mb-4">
              Информация о заказе
            </h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Номер заказа</span>
                <span className="font-medium text-text-primary">
                  {order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-text-secondary">Сумма</span>
                <span className="font-medium text-text-primary">
                  {order.total.toLocaleString('ru-RU')} ₽
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-text-secondary">Статус</span>
                <span className="font-medium text-amber-600">
                  Ожидает оплаты
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Possible reasons */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl p-4 mb-8 text-left">
          <h3 className="font-medium text-amber-800 dark:text-amber-200 mb-2">
            Возможные причины:
          </h3>
          <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
            <li>• Недостаточно средств на счёте</li>
            <li>• Превышен лимит по карте</li>
            <li>• Истекло время ожидания оплаты</li>
            <li>• Технические проблемы на стороне банка</li>
          </ul>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/checkout">
            <Button className="h-12 px-8 w-full sm:w-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Попробовать снова
            </Button>
          </Link>
          
          <Link href="/support">
            <Button variant="outline" className="h-12 px-8 w-full sm:w-auto">
              <MessageCircle className="w-4 h-4 mr-2" />
              Связаться с поддержкой
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
