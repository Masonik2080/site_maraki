// components/checkout/qr-payment-modal.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { X, Loader2, CheckCircle, XCircle, Clock, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PaymentClientService } from '@/lib/services/payment.client';
import { cn } from '@/lib/utils';

interface QrPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  paymentId: string;
  qrPayload: string;
  amount: number;
}

type PaymentState = 'waiting' | 'checking' | 'success' | 'failed' | 'expired';

export function QrPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  paymentId,
  qrPayload,
  amount,
}: QrPaymentModalProps) {
  const [state, setState] = useState<PaymentState>('waiting');
  const [statusText, setStatusText] = useState('Ожидание оплаты');
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 минут
  
  // Генерируем URL для QR-кода
  const qrImageUrl = PaymentClientService.generateQrDataUrl(qrPayload);
  
  // Таймер обратного отсчета
  useEffect(() => {
    if (!isOpen || state !== 'waiting') return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setState('expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [isOpen, state]);
  
  // Поллинг статуса
  useEffect(() => {
    if (!isOpen || state !== 'waiting') return;
    
    let cancelled = false;
    
    const pollStatus = async () => {
      const result = await PaymentClientService.pollStatus(paymentId, {
        intervalMs: 3000,
        maxAttempts: 100,
        onStatusChange: (status) => {
          if (cancelled) return;
          
          switch (status) {
            case 'AUTHORIZING':
            case 'CONFIRMING':
              setState('checking');
              setStatusText('Обработка платежа...');
              break;
            case 'CONFIRMED':
            case 'AUTHORIZED':
              setState('success');
              setStatusText('Оплата прошла успешно!');
              break;
            case 'REJECTED':
            case 'AUTH_FAIL':
              setState('failed');
              setStatusText('Платёж отклонён');
              break;
            case 'CANCELED':
            case 'DEADLINE_EXPIRED':
              setState('expired');
              setStatusText('Время оплаты истекло');
              break;
          }
        },
      });
      
      if (cancelled) return;
      
      if (result.isPaid) {
        setState('success');
        setStatusText('Оплата прошла успешно!');
        setTimeout(onSuccess, 1500);
      }
    };
    
    pollStatus();
    
    return () => {
      cancelled = true;
    };
  }, [isOpen, paymentId, state, onSuccess]);
  
  // Форматирование времени
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  // Обработка успеха
  useEffect(() => {
    if (state === 'success') {
      const timer = setTimeout(onSuccess, 2000);
      return () => clearTimeout(timer);
    }
  }, [state, onSuccess]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={state === 'waiting' ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className="relative modal-content rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Оплата через СБП
          </h2>
          {state === 'waiting' && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-zinc-500" />
            </button>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* QR Code */}
          <div className="flex flex-col items-center">
            {state === 'waiting' && (
              <>
                {/* QR Container */}
                <div className="relative bg-white rounded-2xl p-5 border border-zinc-200">
                  <img
                    src={qrImageUrl}
                    alt="QR-код для оплаты"
                    className="w-52 h-52"
                  />
                </div>
                
                {/* Timer */}
                <div className={cn(
                  'mt-4 flex items-center gap-2 px-4 py-2 rounded-full',
                  timeLeft < 60 
                    ? 'bg-red-50 dark:bg-red-950/30' 
                    : 'bg-zinc-100 dark:bg-zinc-800'
                )}>
                  <Clock className={cn(
                    'w-4 h-4',
                    timeLeft < 60 ? 'text-red-500' : 'text-zinc-500'
                  )} />
                  <span className={cn(
                    'text-sm font-semibold tabular-nums',
                    timeLeft < 60 ? 'text-red-500' : 'text-zinc-900 dark:text-white'
                  )}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                
                {/* Amount */}
                <p className="mt-5 text-3xl font-bold text-zinc-900 dark:text-white">
                  {amount.toLocaleString('ru-RU')} ₽
                </p>
                
                {/* Instructions */}
                <div className="mt-6 w-full space-y-2.5">
                  {[
                    'Откройте приложение вашего банка',
                    'Найдите раздел «Оплата по QR» или «СБП»',
                    'Отсканируйте QR-код и подтвердите оплату',
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                        {i + 1}
                      </span>
                      <span className="text-zinc-600 dark:text-zinc-400">{text}</span>
                    </div>
                  ))}
                </div>
                
                {/* Mobile link */}
                <a
                  href={qrPayload}
                  className="mt-6 flex items-center gap-2 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-colors text-sm font-medium text-zinc-900 dark:text-white"
                >
                  <Smartphone className="w-4 h-4" />
                  Открыть в приложении банка
                </a>
              </>
            )}
            
            {state === 'checking' && (
              <div className="py-12 text-center">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin mx-auto" />
                <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                  {statusText}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Пожалуйста, подождите
                </p>
              </div>
            )}
            
            {state === 'success' && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                  {statusText}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  Перенаправляем вас...
                </p>
              </div>
            )}
            
            {(state === 'failed' || state === 'expired') && (
              <div className="py-12 text-center">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                  <XCircle className="w-10 h-10 text-red-500" />
                </div>
                <p className="mt-4 text-lg font-medium text-zinc-900 dark:text-white">
                  {statusText}
                </p>
                <p className="text-sm text-zinc-500 mt-1">
                  {state === 'expired' 
                    ? 'Попробуйте оплатить заново'
                    : 'Проверьте данные и попробуйте снова'
                  }
                </p>
                <Button onClick={onClose} className="mt-6">
                  Закрыть
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
