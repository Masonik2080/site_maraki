// components/shop/shop-header.tsx
import { Sparkles } from 'lucide-react';

export function ShopHeader() {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-xs font-medium text-emerald-600 mb-5">
        <Sparkles className="w-3.5 h-3.5" />
        Обновлено для ЕГЭ 2025
      </div>
      <h1 className="text-3xl md:text-4xl font-bold text-text-primary tracking-tight mb-4">
        Сборник вариантов ЕГЭ
      </h1>
      <p className="text-text-secondary text-lg leading-relaxed">
        Выберите пакет вариантов для подготовки. Каждый пакет включает PDF с заданиями, 
        ответы и видеоразборы от экспертов.
      </p>
    </div>
  );
}
