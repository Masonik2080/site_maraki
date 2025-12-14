// components/shop/package-purchase-client.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CourseProduct, VariantPackage } from '@/lib/dao/types';
import { CartClientService } from '@/lib/services/cart.client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ShoppingCart, Sparkles, Package } from 'lucide-react';

interface PackagePurchaseClientProps {
  course: CourseProduct;
  packages: VariantPackage[];
  bulkPurchase: VariantPackage | null;
}

export function PackagePurchaseClient({ course, packages, bulkPurchase }: PackagePurchaseClientProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [buyingBulk, setBuyingBulk] = useState(false);

  // Считаем итого для выбранных пакетов
  const selectedPackages = packages.filter(p => selectedIds.includes(p.id));
  const selectedTotal = selectedPackages.reduce((sum, p) => sum + p.price, 0);
  
  // Выгода при покупке всего
  const allPackagesTotal = packages.reduce((sum, p) => sum + p.price, 0);
  const bulkSavings = bulkPurchase ? allPackagesTotal - bulkPurchase.price : 0;

  const togglePackage = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleBuySelected = async () => {
    if (!user) {
      router.push(`/login?redirect=/shop/${course.slug}`);
      return;
    }

    if (selectedIds.length === 0) return;

    setLoading(true);
    
    // Добавляем все выбранные пакеты в корзину
    for (const id of selectedIds) {
      await CartClientService.addItem(id, 'variant_pack');
    }
    
    router.push('/checkout');
  };

  const handleBuyBulk = async () => {
    if (!user) {
      router.push(`/login?redirect=/shop/${course.slug}`);
      return;
    }

    if (!bulkPurchase) return;

    setBuyingBulk(true);
    await CartClientService.addItem(bulkPurchase.id, 'variant_pack');
    router.push('/checkout');
  };

  const handleBuyCourse = async () => {
    if (!user) {
      router.push(`/login?redirect=/shop/${course.slug}`);
      return;
    }

    setLoading(true);
    await CartClientService.addItem(course.id, 'course');
    router.push('/checkout');
  };

  // Если нет пакетов — показываем простую покупку курса
  if (packages.length === 0) {
    const discount = course.originalPrice 
      ? Math.round((1 - course.price / course.originalPrice) * 100) 
      : 0;

    return (
      <div className="border border-border-main rounded-2xl p-6 bg-[--color-page-bg]">
        <div className="flex items-baseline justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-text-primary">
                {course.price.toLocaleString('ru-RU')} ₽
              </span>
              {course.originalPrice && (
                <span className="text-lg text-text-secondary line-through">
                  {course.originalPrice.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>
          </div>
          {discount > 0 && (
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 rounded-full">
              -{discount}%
            </span>
          )}
        </div>

        <Button 
          className="w-full h-12 text-base"
          onClick={handleBuyCourse}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            'Купить курс'
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bulk Purchase Option */}
      {bulkPurchase && (
        <div className="border-2 border-action rounded-2xl p-6 bg-action/5 relative">
          <div className="absolute -top-3 left-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-action text-action-text">
              <Sparkles className="w-3 h-3" />
              Лучшая цена
            </span>
          </div>

          <h3 className="font-semibold text-text-primary text-lg mb-2 mt-2">
            {bulkPurchase.title}
          </h3>
          <p className="text-sm text-text-secondary mb-4">
            {bulkPurchase.description}
          </p>

          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-3xl font-bold text-text-primary">
              {bulkPurchase.price.toLocaleString('ru-RU')} ₽
            </span>
            {bulkPurchase.originalPrice && (
              <span className="text-lg text-text-secondary line-through">
                {bulkPurchase.originalPrice.toLocaleString('ru-RU')} ₽
              </span>
            )}
            {bulkSavings > 0 && (
              <span className="text-sm font-medium text-emerald-600">
                Экономия {bulkSavings.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>

          <Button 
            className="w-full h-12 text-base"
            onClick={handleBuyBulk}
            disabled={buyingBulk}
          >
            {buyingBulk ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Купить всё со скидкой'
            )}
          </Button>
        </div>
      )}

      {/* Individual Packages */}
      <div className="border border-border-main rounded-2xl p-6 bg-[--color-page-bg]">
        <h3 className="font-semibold text-text-primary mb-4">
          Или выберите отдельные пакеты:
        </h3>

        <div className="space-y-3 mb-6">
          {packages.map((pkg) => {
            const isSelected = selectedIds.includes(pkg.id);
            
            return (
              <button
                key={pkg.id}
                onClick={() => togglePackage(pkg.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  isSelected 
                    ? 'border-action bg-action/5' 
                    : 'border-border-main hover:border-action/30'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected 
                        ? 'border-action bg-action' 
                        : 'border-border-main'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-action-text" />}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{pkg.title}</div>
                      <div className="text-sm text-text-secondary">{pkg.description}</div>
                    </div>
                  </div>
                  <div className="font-semibold text-text-primary whitespace-nowrap">
                    {pkg.price.toLocaleString('ru-RU')} ₽
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Summary */}
        {selectedIds.length > 0 && (
          <div className="border-t border-border-main pt-4 mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-secondary">Выбрано пакетов:</span>
              <span className="font-medium text-text-primary">{selectedIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium text-text-primary">Итого:</span>
              <span className="text-xl font-bold text-text-primary">
                {selectedTotal.toLocaleString('ru-RU')} ₽
              </span>
            </div>
          </div>
        )}

        <Button 
          className="w-full h-11"
          onClick={handleBuySelected}
          disabled={loading || selectedIds.length === 0}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : selectedIds.length === 0 ? (
            'Выберите пакеты'
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-2" />
              Купить выбранное
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
