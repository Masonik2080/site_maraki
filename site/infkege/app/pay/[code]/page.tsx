'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { QrCode, CreditCard, Smartphone, Loader2, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LinkInfo {
  code: string;
  amount: number;
  description: string;
  allowSbp: boolean;
  allowCard: boolean;
  allowTpay: boolean;
  requiresAuth: boolean;
}

type PaymentMethod = 'sbp' | 'card' | 'tpay';
type PageState = 'loading' | 'form' | 'processing' | 'qr' | 'success' | 'error';

export default function PayPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  
  const [state, setState] = useState<PageState>('loading');
  const [link, setLink] = useState<LinkInfo | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [error, setError] = useState('');
  
  // Form
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('sbp');
  const [contactInfo, setContactInfo] = useState('');
  const [contactType, setContactType] = useState('email');
  
  // Payment result
  const [qrPayload, setQrPayload] = useState('');
  const [paymentId, setPaymentId] = useState('');

  useEffect(() => {
    loadLink();
  }, [code]);

  const loadLink = async () => {
    try {
      const res = await fetch(`/api/pay/${code}`);
      const data = await res.json();
      
      if (!res.ok) {
        if (data.requiresAuth) {
          window.location.href = data.redirectUrl;
          return;
        }
        setError(data.error || 'Ссылка недоступна');
        setState('error');
        return;
      }
      
      setLink(data.link);
      setIsAuthenticated(data.isAuthenticated);
      setUserEmail(data.userEmail);
      
      // Выбираем первый доступный метод
      if (data.link.allowSbp) setPaymentMethod('sbp');
      else if (data.link.allowCard) setPaymentMethod('card');
      else if (data.link.allowTpay) setPaymentMethod('tpay');
      
      setState('form');
    } catch {
      setError('Ошибка загрузки');
      setState('error');
    }
  };

  const handlePay = async () => {
    if (!link) return;
    
    // Валидация для неавторизованных
    if (!isAuthenticated && !contactInfo.trim()) {
      setError('Укажите контактные данные');
      return;
    }
    
    setError('');
    setState('processing');
    
    try {
      const res = await fetch(`/api/pay/${code}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          contactInfo: contactInfo.trim() || undefined,
          contactType: contactInfo.trim() ? contactType : undefined,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || 'Ошибка оплаты');
        setState('form');
        return;
      }
      
      setPaymentId(data.paymentId);
      
      if (data.qrPayload) {
        setQrPayload(data.qrPayload);
        setState('qr');
        // Начинаем проверять статус
        startPolling(data.paymentId);
      } else if (data.paymentUrl) {
        // Редирект на платёжную форму
        window.location.href = data.paymentUrl;
      }
    } catch {
      setError('Ошибка оплаты');
      setState('form');
    }
  };

  const startPolling = (id: string) => {
    const interval = setInterval(async () => {
      try {
        // Используем linkPaymentId для платежей по ссылке
        const res = await fetch(`/api/payment/status?linkPaymentId=${id}`);
        const data = await res.json();
        
        if (data.isPaid) {
          clearInterval(interval);
          setState('success');
        }
      } catch {
        // ignore
      }
    }, 3000);
    
    // Остановить через 15 минут
    setTimeout(() => clearInterval(interval), 15 * 60 * 1000);
  };

  const getMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'sbp': return <QrCode size={20} />;
      case 'card': return <CreditCard size={20} />;
      case 'tpay': return <Smartphone size={20} />;
    }
  };

  const getMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'sbp': return 'СБП (QR-код)';
      case 'card': return 'Банковская карта';
      case 'tpay': return 'T-Pay';
    }
  };


  // Loading
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[--color-page-bg] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-action" />
      </div>
    );
  }

  // Error
  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[--color-page-bg] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Ссылка недоступна</h1>
          <p className="text-text-secondary mb-6">{error}</p>
          <Link
            href="/"
            className="inline-block px-6 py-2 bg-action text-white rounded-lg hover:bg-action/90 transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // Success
  if (state === 'success') {
    const handleDownloadReceipt = () => {
      // Открываем чек в новом окне для печати/сохранения
      window.open(`/api/pay/${code}/receipt?paymentId=${paymentId}`, '_blank');
    };
    
    return (
      <div className="min-h-screen bg-[--color-page-bg] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-2">Оплата прошла успешно!</h1>
          <p className="text-text-secondary mb-2">
            Спасибо за оплату услуги infkege
          </p>
          {link && (
            <p className="text-sm text-text-secondary mb-6">
              {link.description} — {link.amount.toLocaleString('ru-RU')} ₽
            </p>
          )}
          
          {/* Кнопка скачивания чека */}
          <button
            onClick={handleDownloadReceipt}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 border border-border-main rounded-xl text-text-primary hover:bg-zinc-50 transition-colors mb-4"
          >
            <Download size={18} />
            Скачать чек
          </button>
          
          <Link
            href="/"
            className="inline-block text-action hover:underline text-sm"
          >
            На главную
          </Link>
        </div>
      </div>
    );
  }

  // QR Code view
  if (state === 'qr' && qrPayload) {
    return (
      <div className="min-h-screen bg-[--color-page-bg] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-text-primary mb-2">Оплатите по QR-коду</h1>
            <p className="text-text-secondary text-sm">
              Откройте приложение банка и отсканируйте код
            </p>
          </div>
          
          {/* QR Code - используем img с API */}
          <div className="bg-white p-4 rounded-xl border border-border-main flex items-center justify-center mb-6">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(qrPayload)}`}
              alt="QR код для оплаты"
              width={240}
              height={240}
              className="rounded"
            />
          </div>
          
          {/* Info */}
          <div className="bg-zinc-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-text-secondary text-sm">Услуга</span>
              <span className="text-text-primary text-sm font-medium">{link?.description}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary text-sm">Сумма</span>
              <span className="text-text-primary font-bold">{link?.amount.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
          
          {/* Status */}
          <div className="flex items-center justify-center gap-2 text-text-secondary text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Ожидаем оплату...
          </div>
        </div>
      </div>
    );
  }


  // Payment Form
  return (
    <div className="min-h-screen bg-[--color-page-bg] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-action to-action/80 p-6 text-white">
          <div className="text-sm opacity-80 mb-1">Оплата услуги</div>
          <h1 className="text-lg font-bold mb-2">{link?.description}</h1>
          <div className="text-3xl font-bold">
            {link?.amount.toLocaleString('ru-RU')} ₽
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {/* User info or contact form */}
          {isAuthenticated ? (
            <div className="p-4 bg-zinc-50 rounded-xl">
              <div className="text-xs text-text-secondary mb-1">Вы авторизованы как</div>
              <div className="text-sm font-medium text-text-primary">{userEmail}</div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Контактные данные *
              </label>
              
              {/* Тип контакта */}
              <div className="flex gap-2 mb-2">
                {[
                  { value: 'email', label: 'Email' },
                  { value: 'phone', label: 'Телефон' },
                  { value: 'telegram', label: 'Telegram' },
                  { value: 'other', label: 'Другое' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setContactType(value)}
                    className={cn(
                      'px-3 py-1 text-xs rounded-full border transition-colors',
                      contactType === value
                        ? 'bg-action text-white border-action'
                        : 'border-border-main text-text-secondary hover:border-action'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
              <input
                type={contactType === 'email' ? 'email' : 'text'}
                value={contactInfo}
                onChange={e => setContactInfo(e.target.value)}
                placeholder={
                  contactType === 'email' ? 'example@mail.ru' :
                  contactType === 'phone' ? '+7 999 123-45-67' :
                  contactType === 'telegram' ? '@username' :
                  'Ваши контактные данные'
                }
                className="w-full px-4 py-3 border border-border-main rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action"
              />
              
              {/* ВАЖНО: пояснение что можно указать что угодно */}
              <p className="text-xs text-text-secondary mt-2">
                💡 Укажите любой удобный способ связи: email, телефон, Telegram, имя — 
                это нужно для подтверждения оплаты и связи с вами при необходимости.
              </p>
            </div>
          )}

          {/* Payment methods */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Способ оплаты
            </label>
            <div className="space-y-2">
              {(['sbp', 'card', 'tpay'] as PaymentMethod[]).map(method => {
                const allowed = link?.[`allow${method.charAt(0).toUpperCase() + method.slice(1)}` as keyof LinkInfo];
                if (!allowed) return null;
                
                return (
                  <label
                    key={method}
                    className={cn(
                      'flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all',
                      paymentMethod === method
                        ? 'border-action bg-action/5'
                        : 'border-border-main hover:border-action/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      className="sr-only"
                    />
                    <div className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      paymentMethod === method
                        ? 'bg-action text-white'
                        : 'bg-zinc-100 text-text-secondary'
                    )}>
                      {getMethodIcon(method)}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-text-primary">{getMethodLabel(method)}</div>
                      <div className="text-xs text-text-secondary">
                        {method === 'sbp' && 'Быстрая оплата через приложение банка'}
                        {method === 'card' && 'Visa, Mastercard, МИР'}
                        {method === 'tpay' && 'Оплата через Т-Банк'}
                      </div>
                    </div>
                    <div className={cn(
                      'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                      paymentMethod === method ? 'border-action' : 'border-zinc-300'
                    )}>
                      {paymentMethod === method && (
                        <div className="w-2.5 h-2.5 rounded-full bg-action" />
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={state === 'processing'}
            className="w-full py-4 bg-action text-white font-semibold rounded-xl hover:bg-action/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {state === 'processing' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Обработка...
              </>
            ) : (
              `Оплатить ${link?.amount.toLocaleString('ru-RU')} ₽`
            )}
          </button>

          {/* Footer */}
          <p className="text-xs text-text-secondary text-center">
            Нажимая кнопку, вы соглашаетесь с{' '}
            <Link href="/legal" className="text-action hover:underline">
              условиями оферты
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
