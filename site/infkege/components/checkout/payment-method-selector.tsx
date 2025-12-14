// components/checkout/payment-method-selector.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CreditCard, QrCode, Smartphone, ChevronDown, HelpCircle } from 'lucide-react';

// Определяем тип локально
type PaymentMethod = 'sbp' | 'card' | 'tpay';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: React.ReactNode;
  recommended?: boolean;
}

const SBP_OPTION: PaymentMethodOption = {
  id: 'sbp',
  name: 'СБП (QR-код)',
  description: 'Быстрая оплата через приложение банка',
  icon: <QrCode className="w-5 h-5" />,
  recommended: true,
};

const ALTERNATIVE_OPTIONS: PaymentMethodOption[] = [
  {
    id: 'card',
    name: 'Банковская карта',
    description: 'Visa, Mastercard, МИР',
    icon: <CreditCard className="w-5 h-5" />,
  },
  {
    id: 'tpay',
    name: 'T-Pay',
    description: 'Оплата через Т-Банк',
    icon: <Smartphone className="w-5 h-5" />,
  },
];

interface PaymentMethodSelectorProps {
  selected: string;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  selected,
  onChange,
  disabled,
}: PaymentMethodSelectorProps) {
  const [showAlternatives, setShowAlternatives] = useState(false);
  
  // Если выбран альтернативный метод, показываем его
  const isAlternativeSelected = selected === 'card' || selected === 'tpay';
  
  const renderOption = (option: PaymentMethodOption) => {
    const isSelected = selected === option.id;

    return (
      <label
        key={option.id}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-xl border transition-all curursor-pointer',
          'hover:border-action/50',
          isSelected
            ? 'border-action bg-action/5'
            : 'border-border-main bg-[--color-page-bg]',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {/* Hidden radio input */}
        <input
          type="radio"
          name="paymentMethod"
          value={option.id}
          checked={isSelected}
          onChange={() => onChange(option.id)}
          disabled={disabled}
          className="sr-only"
        />

        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            isSelected
              ? 'bg-action text-white'
              : 'bg-zinc-100 dark:bg-zinc-800 text-text-secondary'
          )}
        >
          {option.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-text-primary">
              {option.name}
            </span>
            {option.recommended && (
              <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full dark:bg-emerald-900/30 dark:text-emerald-400">
                Рекомендуем
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            {option.description}
          </p>
        </div>

        {/* Custom radio circle */}
        <div
          className={cn(
            'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
            isSelected
              ? 'border-action'
              : 'border-zinc-300 dark:border-zinc-600'
          )}
        >
          {isSelected && (
            <div className="w-2.5 h-2.5 rounded-full bg-action" />
          )}
        </div>
      </label>
    );
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-text-primary">Способ оплаты</h3>

      <div className="space-y-2">
        {/* СБП — всегда видимый */}
        {renderOption(SBP_OPTION)}
        
        {/* Кнопка для показа альтернативных методов */}
        <button
          type="button"
          onClick={() => setShowAlternatives(!showAlternatives)}
          disabled={disabled}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl',
            'text-sm text-text-secondary hover:text-text-primary',
            'border border-dashed border-border-main hover:border-action/50',
            'transition-all',
            disabled && 'opacity-50 cursor-not-allowed',
            (showAlternatives || isAlternativeSelected) && 'border-action/30 bg-action/5'
          )}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Проблемы с оплатой по СБП?</span>
          <ChevronDown 
            className={cn(
              'w-4 h-4 transition-transform',
              (showAlternatives || isAlternativeSelected) && 'rotate-180'
            )} 
          />
        </button>
        
        {/* Альтернативные методы — в поповере */}
        {(showAlternatives || isAlternativeSelected) && (
          <div className="space-y-2 pt-2 animate-in slide-in-from-top-2 duration-200">
            <p className="text-xs text-text-secondary px-1">
              Выберите альтернативный способ оплаты:
            </p>
            {ALTERNATIVE_OPTIONS.map(renderOption)}
          </div>
        )}
      </div>
    </div>
  );
}
