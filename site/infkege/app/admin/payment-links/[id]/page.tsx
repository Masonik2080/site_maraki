'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentLink {
  id: string;
  code: string;
  amount: number;
  description: string;
  allowSbp: boolean;
  allowCard: boolean;
  allowTpay: boolean;
  requiresAuth: boolean;
  usageType: 'single' | 'limited' | 'unlimited';
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  status: string;
  createdAt: string;
}

interface Payment {
  id: string;
  userId: string | null;
  contactInfo: string | null;
  contactType: string | null;
  paymentMethod: string | null;
  status: string;
  createdAt: string;
  paidAt: string | null;
}

export default function PaymentLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const res = await fetch(`/api/admin/payment-links/${id}`);
      const data = await res.json();
      setLink(data.link);
      setPayments(data.payments || []);
    } catch {
      console.error('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!link) return;
    const url = `${window.location.origin}/pay/${link.code}`;
    navigator.clipboard.writeText(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-emerald-500" />;
      case 'failed': return <XCircle size={16} className="text-red-500" />;
      case 'cancelled': return <XCircle size={16} className="text-zinc-400" />;
      default: return <Clock size={16} className="text-amber-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ожидает',
      completed: 'Оплачено',
      failed: 'Ошибка',
      cancelled: 'Отменено',
    };
    return labels[status] || status;
  };

  const getLinkStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      active: 'Активна',
      exhausted: 'Исчерпана',
      expired: 'Истекла',
      disabled: 'Отключена',
    };
    return labels[status] || status;
  };

  const getContactTypeLabel = (type: string | null) => {
    if (!type) return null;
    const labels: Record<string, string> = {
      email: 'Email',
      phone: 'Телефон',
      telegram: 'Telegram',
      other: 'Другое',
    };
    return labels[type] || type;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        {/* Back skeleton */}
        <div className="h-5 w-32 bg-zinc-100 rounded animate-pulse mb-4" />
        
        {/* Header skeleton */}
        <div className="bg-white border border-border-main rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="h-6 w-48 bg-zinc-200 rounded animate-pulse" />
              <div className="flex items-center gap-2 mt-2">
                <div className="h-4 w-24 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
            <div className="text-right">
              <div className="h-8 w-20 bg-zinc-200 rounded animate-pulse" />
              <div className="h-5 w-16 bg-zinc-100 rounded-full animate-pulse mt-1" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-main">
            {[1, 2, 3, 4].map(i => (
              <div key={i}>
                <div className="h-3 w-20 bg-zinc-100 rounded animate-pulse mb-1" />
                <div className="h-6 w-12 bg-zinc-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
          
          <div className="flex gap-2 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-6 w-12 bg-zinc-100 rounded animate-pulse" />
            ))}
          </div>
        </div>
        
        {/* Payments skeleton */}
        <div className="bg-white border border-border-main rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border-main">
            <div className="h-5 w-32 bg-zinc-200 rounded animate-pulse" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="px-6 py-4 flex items-center gap-4 border-b border-border-main last:border-0">
              <div className="w-4 h-4 bg-zinc-100 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 w-32 bg-zinc-100 rounded animate-pulse mb-1" />
                <div className="h-3 w-24 bg-zinc-100 rounded animate-pulse" />
              </div>
              <div className="text-right">
                <div className="h-4 w-16 bg-zinc-100 rounded animate-pulse mb-1" />
                <div className="h-3 w-12 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!link) {
    return <div className="p-6 text-center text-text-secondary">Ссылка не найдена</div>;
  }

  const totalPaid = payments.filter(p => p.status === 'completed').length * link.amount;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back */}
      <Link
        href="/admin/payment-links"
        className="inline-flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft size={16} />
        Назад к списку
      </Link>

      {/* Header */}
      <div className="bg-white border border-border-main rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary">{link.description}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-sm text-text-secondary">{link.code}</span>
              <button
                onClick={copyLink}
                className="p-1 text-text-secondary hover:text-action transition-colors"
                title="Копировать ссылку"
              >
                <Copy size={14} />
              </button>
              <a
                href={`/pay/${link.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 text-text-secondary hover:text-action transition-colors"
                title="Открыть"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-text-primary">
              {link.amount.toLocaleString('ru-RU')} ₽
            </div>
            <div className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1',
              link.status === 'active' && 'bg-emerald-100 text-emerald-700',
              link.status === 'exhausted' && 'bg-zinc-100 text-zinc-600',
              link.status === 'expired' && 'bg-amber-100 text-amber-700',
              link.status === 'disabled' && 'bg-red-100 text-red-700'
            )}>
              {getLinkStatusLabel(link.status)}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border-main">
          <div>
            <div className="text-xs text-text-secondary">Использований</div>
            <div className="text-lg font-semibold text-text-primary">
              {link.currentUses}
              {link.usageType === 'limited' && ` / ${link.maxUses}`}
              {link.usageType === 'single' && ' / 1'}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">Успешных оплат</div>
            <div className="text-lg font-semibold text-emerald-600">
              {payments.filter(p => p.status === 'completed').length}
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">Собрано</div>
            <div className="text-lg font-semibold text-text-primary">
              {totalPaid.toLocaleString('ru-RU')} ₽
            </div>
          </div>
          <div>
            <div className="text-xs text-text-secondary">Создана</div>
            <div className="text-sm text-text-primary">
              {formatDate(link.createdAt)}
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="flex flex-wrap gap-2 mt-4">
          {link.allowSbp && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">СБП</span>}
          {link.allowCard && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded">Карта</span>}
          {link.allowTpay && <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-xs rounded">T-Pay</span>}
          {link.requiresAuth && <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded">🔒 Авторизация</span>}
        </div>
      </div>

      {/* Payments History */}
      <div className="bg-white border border-border-main rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border-main">
          <h2 className="font-semibold text-text-primary">История платежей</h2>
        </div>
        
        {payments.length === 0 ? (
          <div className="p-6 text-center text-text-secondary text-sm">
            Пока нет платежей
          </div>
        ) : (
          <div className="divide-y divide-border-main">
            {payments.map(payment => (
              <div key={payment.id} className="px-6 py-4 flex items-center gap-4">
                {getStatusIcon(payment.status)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary">
                    {payment.userId ? (
                      <span>Пользователь #{payment.userId.slice(0, 8)}</span>
                    ) : (
                      <span>
                        {payment.contactInfo || 'Гость'}
                        {payment.contactType && (
                          <span className="text-text-secondary ml-1">
                            ({getContactTypeLabel(payment.contactType)})
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-text-secondary">
                    {formatDate(payment.createdAt)}
                    {payment.paymentMethod && ` • ${payment.paymentMethod.toUpperCase()}`}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-text-primary">
                    {link.amount.toLocaleString('ru-RU')} ₽
                  </div>
                  <div className="text-xs text-text-secondary">
                    {getStatusLabel(payment.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
