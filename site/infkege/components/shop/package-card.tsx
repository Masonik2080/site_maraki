// components/shop/package-card.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VariantPackage } from '@/lib/dao/types';
import { CartClientService } from '@/lib/services/cart.client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Loader2, Check, ShoppingCart, Sparkles } from 'lucide-react';

interface PackageCardProps {
  package: VariantPackage;
}

export function PackageCard({ package: pkg }: PackageCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const discount = pkg.originalPrice 
    ? Math.round((1 - pkg.price / pkg.originalPrice) * 100) 
    : 0;

  const variantCount = pkg.variantRange.to - pkg.variantRange.from + 1;
  const isFullPack = pkg.externalId === 'pack-full';

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login?redirect=/shop');
      return;
    }

    setLoading(true);
    const success = await CartClientService.addItem(pkg.id, 'variant_pack');
    setLoading(false);
    
    if (success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login?redirect=/shop');
      return;
    }

    setLoading(true);
    await CartClientService.addItem(pkg.id, 'variant_pack');
    router.push('/checkout');
  };

  return (
    <div 
      className={`
        relative flex flex-col rounded-2xl border bg-[--color-page-bg] p-5 transition-all
        ${isFullPack 
          ? 'border-action/40 shadow-lg shadow-action/5 ring-1 ring-action/10' 
          : 'border-border-main hover:border-action/20 hover:shadow-md'
        }
      `}
    >
      {/* Badge */}
      {isFullPack && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-action text-action-text shadow-sm">
            <Sparkles className="w-3 h-3" />
            Лучшая цена
          </span>
        </div>
      )}

      {/* Header */}
      <div className="mb-4 pt-1">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-semibold text-text-primary text-lg">{pkg.title}</h3>
          {discount > 0 && (
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>
        <p className="text-sm text-text-secondary">
          Варианты {pkg.variantRange.from}–{pkg.variantRange.to}
        </p>
      </div>

      {/* Price */}
      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-text-primary">
            {pkg.price.toLocaleString('ru-RU')}
          </span>
          <span className="text-lg text-text-secondary">₽</span>
          {pkg.originalPrice && (
            <span className="text-sm text-text-secondary line-through ml-1">
              {pkg.originalPrice.toLocaleString('ru-RU')} ₽
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary mt-1">
          ≈ {Math.round(pkg.price / variantCount)} ₽ за вариант
        </p>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        <li className="flex items-center gap-2.5 text-sm text-text-primary">
          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-emerald-500" />
          </div>
          <span>{variantCount} вариантов ЕГЭ</span>
        </li>
        <li className="flex items-center gap-2.5 text-sm text-text-primary">
          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-emerald-500" />
          </div>
          <span>PDF с заданиями</span>
        </li>
        <li className="flex items-center gap-2.5 text-sm text-text-primary">
          <div className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center shrink-0">
            <Check className="w-3 h-3 text-emerald-500" />
          </div>
          <span>Ответы и видеоразборы</span>
        </li>
        {isFullPack && (
          <li className="flex items-center gap-2.5 text-sm text-action font-medium">
            <div className="w-5 h-5 rounded-full bg-action/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-action" />
            </div>
            <span>Все обновления бесплатно</span>
          </li>
        )}
      </ul>

      {/* Actions */}
      <div className="space-y-2.5">
        <Button 
          className={`w-full h-10 ${isFullPack ? 'shadow-sm' : ''}`}
          onClick={handleBuyNow}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Купить сейчас'
          )}
        </Button>
        <Button 
          variant="outline" 
          className="w-full h-10"
          onClick={handleAddToCart}
          disabled={loading || added}
        >
          {added ? (
            <>
              <Check className="w-4 h-4 mr-1.5 text-emerald-500" />
              <span className="text-emerald-600">Добавлено</span>
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              В корзину
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
