'use client';

import { useState, useEffect, useMemo, useCallback, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Copy, ExternalLink, Trash2, Eye, AlertCircle, Check, MoreVertical, Archive, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

// Skeleton component
function PaymentLinksSkeleton() {
  return (
    <>
      {/* Desktop Skeleton */}
      <div className="hidden lg:block bg-white border border-border-main rounded-xl overflow-hidden">
        <div className="border-b border-border-main bg-zinc-50 px-4 py-3 flex gap-4">
          <div className="w-4 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="flex-1 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-20 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-24 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-16 h-4 bg-zinc-200 rounded animate-pulse" />
          <div className="w-20 h-4 bg-zinc-200 rounded animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="px-4 py-4 border-b border-border-main last:border-0 flex items-center gap-4">
            <div className="w-4 h-4 bg-zinc-100 rounded animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-20" />
            </div>
            <div className="w-16 h-4 bg-zinc-100 rounded animate-pulse" />
            <div className="flex gap-1">
              <div className="w-10 h-5 bg-zinc-100 rounded animate-pulse" />
              <div className="w-12 h-5 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="w-12 h-4 bg-zinc-100 rounded animate-pulse" />
            <div className="w-16 h-5 bg-zinc-100 rounded-full animate-pulse" />
            <div className="flex gap-1">
              {[1, 2, 3, 4].map(j => (
                <div key={j} className="w-7 h-7 bg-zinc-100 rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Mobile Skeleton */}
      <div className="lg:hidden space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white border border-border-main rounded-xl p-4">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-4 h-4 bg-zinc-100 rounded animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-zinc-100 rounded animate-pulse w-3/4" />
                <div className="h-3 bg-zinc-100 rounded animate-pulse w-20" />
              </div>
              <div className="w-6 h-6 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-16 h-6 bg-zinc-100 rounded animate-pulse" />
                <div className="w-16 h-5 bg-zinc-100 rounded-full animate-pulse" />
              </div>
              <div className="w-10 h-4 bg-zinc-100 rounded animate-pulse" />
            </div>
            <div className="flex gap-1 pt-3 border-t border-border-main">
              <div className="w-10 h-5 bg-zinc-100 rounded animate-pulse" />
              <div className="w-12 h-5 bg-zinc-100 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

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
  status: 'active' | 'expired' | 'exhausted' | 'disabled';
  createdAt: string;
}

type FilterType = 'all' | 'active' | 'archive';
type LinkStatus = PaymentLink['status'];

function PaymentLinksContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Читаем фильтр из URL при инициализации
  const getInitialFilter = (): FilterType => {
    const tab = searchParams.get('tab');
    if (tab === 'active' || tab === 'archive' || tab === 'all') return tab;
    return 'active';
  };
  
  const [links, setLinks] = useState<PaymentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [filter, setFilterState] = useState<FilterType>(getInitialFilter);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  
  // Обновляем URL при смене фильтра
  const setFilter = useCallback((newFilter: FilterType) => {
    setFilterState(newFilter);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', newFilter);
    router.replace(url.pathname + url.search, { scroll: false });
  }, [router]);

  const [form, setForm] = useState<{
    amount: number;
    description: string;
    allowSbp: boolean;
    allowCard: boolean;
    allowTpay: boolean;
    requiresAuth: boolean;
    usageType: 'single' | 'limited' | 'unlimited';
    maxUses: number;
    expiresAt: string;
  }>({
    amount: 100,
    description: '',
    allowSbp: true,
    allowCard: true,
    allowTpay: true,
    requiresAuth: false,
    usageType: 'single',
    maxUses: 10,
    expiresAt: '',
  });

  useEffect(() => {
    loadLinks();
    
    // Автообновление каждые 10 секунд
    const interval = setInterval(() => {
      loadLinks();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClick = () => setOpenMenu(null);
    if (openMenu) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openMenu]);

  const loadLinks = async () => {
    try {
      const res = await fetch('/api/admin/payment-links');
      const data = await res.json();
      setLinks(data.links || []);
    } catch {
      setError('Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (form.amount < 10) { setError('Минимальная сумма — 10 рублей'); return; }
    if (!form.description.trim()) { setError('Укажите описание'); return; }
    if (!form.allowSbp && !form.allowCard && !form.allowTpay) { setError('Выберите способ оплаты'); return; }

    setCreating(true);
    try {
      const res = await fetch('/api/admin/payment-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, expiresAt: form.expiresAt || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка'); return; }
      setLinks([data.link, ...links]);
      setShowCreate(false);
      resetForm();
    } catch { setError('Ошибка создания'); }
    finally { setCreating(false); }
  };

  const resetForm = () => setForm({
    amount: 100, description: '', allowSbp: true, allowCard: true, allowTpay: true,
    requiresAuth: false, usageType: 'single', maxUses: 10, expiresAt: '',
  });

  // Optimistic delete
  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Удалить ссылку?')) return;
    
    // Optimistic: сразу удаляем из UI
    const prevLinks = links;
    startTransition(() => {
      setLinks(prev => prev.filter(l => l.id !== id));
      setSelected(prev => { const n = new Set(prev); n.delete(id); return n; });
    });
    
    try {
      const res = await fetch(`/api/admin/payment-links/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      // Rollback при ошибке
      setLinks(prevLinks);
      setError('Ошибка удаления');
    }
  }, [links]);

  // Optimistic status toggle
  const handleToggleStatus = useCallback(async (link: PaymentLink) => {
    const newStatus: LinkStatus = link.status === 'active' ? 'disabled' : 'active';
    
    // Optimistic: сразу обновляем UI
    const prevLinks = links;
    startTransition(() => {
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, status: newStatus } : l));
    });
    
    try {
      const res = await fetch(`/api/admin/payment-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Синхронизируем с реальными данными
      setLinks(prev => prev.map(l => l.id === link.id ? data.link : l));
    } catch {
      // Rollback при ошибке
      setLinks(prevLinks);
      setError('Ошибка');
    }
  }, [links]);

  const copyLink = (code: string, id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/pay/${code}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Активна' },
      expired: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Истекла' },
      exhausted: { bg: 'bg-zinc-100', text: 'text-zinc-600', label: 'Исчерпана' },
      disabled: { bg: 'bg-red-100', text: 'text-red-700', label: 'Откл.' },
    };
    const c = config[status] || config.disabled;
    return <span className={cn('px-2 py-0.5 text-[10px] font-medium rounded-full', c.bg, c.text)}>{c.label}</span>;
  };

  const getUsageLabel = (link: PaymentLink) => {
    if (link.usageType === 'single') return `${link.currentUses}/1`;
    if (link.usageType === 'unlimited') return `${link.currentUses}/∞`;
    return `${link.currentUses}/${link.maxUses}`;
  };

  // Фильтрация ссылок
  const filteredLinks = useMemo(() => {
    if (filter === 'all') return links;
    if (filter === 'active') return links.filter(l => l.status === 'active');
    // archive = exhausted, expired, disabled
    return links.filter(l => ['exhausted', 'expired', 'disabled'].includes(l.status));
  }, [links, filter]);

  // Счётчики для табов
  const counts = useMemo(() => ({
    all: links.length,
    active: links.filter(l => l.status === 'active').length,
    archive: links.filter(l => ['exhausted', 'expired', 'disabled'].includes(l.status)).length,
  }), [links]);

  // Optimistic archive
  const handleArchive = useCallback(async (link: PaymentLink) => {
    // Optimistic: сразу обновляем UI
    const prevLinks = links;
    startTransition(() => {
      setLinks(prev => prev.map(l => l.id === link.id ? { ...l, status: 'disabled' as LinkStatus } : l));
    });
    
    try {
      const res = await fetch(`/api/admin/payment-links/${link.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'disabled' }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLinks(prev => prev.map(l => l.id === link.id ? data.link : l));
    } catch {
      setLinks(prevLinks);
      setError('Ошибка');
    }
  }, [links]);

  // Выбор/снятие выбора элемента
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  // Выбрать все / снять выбор
  const toggleSelectAll = () => {
    if (selected.size === filteredLinks.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredLinks.map(l => l.id)));
    }
  };

  // Optimistic bulk archive
  const handleBulkArchive = useCallback(async () => {
    if (selected.size === 0) return;
    
    const selectedIds = Array.from(selected);
    const prevLinks = links;
    
    // Optimistic: сразу обновляем UI
    startTransition(() => {
      setLinks(prev => prev.map(l => 
        selectedIds.includes(l.id) ? { ...l, status: 'disabled' as LinkStatus } : l
      ));
      setSelected(new Set());
    });
    
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id =>
          fetch(`/api/admin/payment-links/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'disabled' }),
          }).then(res => res.ok ? res.json() : Promise.reject())
        )
      );
      
      // Проверяем ошибки
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        setError(`Не удалось архивировать ${failed} ссылок`);
        loadLinks(); // Перезагружаем для синхронизации
      }
    } catch {
      setLinks(prevLinks);
      setError('Ошибка массового архивирования');
    }
  }, [links, selected]);

  // Optimistic bulk delete
  const handleBulkDelete = useCallback(async () => {
    if (selected.size === 0) return;
    if (!confirm(`Удалить ${selected.size} ссылок?`)) return;
    
    const selectedIds = Array.from(selected);
    const prevLinks = links;
    
    // Optimistic: сразу удаляем из UI
    startTransition(() => {
      setLinks(prev => prev.filter(l => !selectedIds.includes(l.id)));
      setSelected(new Set());
    });
    
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id =>
          fetch(`/api/admin/payment-links/${id}`, { method: 'DELETE' })
            .then(res => res.ok ? res : Promise.reject())
        )
      );
      
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        setError(`Не удалось удалить ${failed} ссылок`);
        loadLinks();
      }
    } catch {
      setLinks(prevLinks);
      setError('Ошибка массового удаления');
    }
  }, [links, selected]);

  // Optimistic bulk restore
  const handleBulkRestore = useCallback(async () => {
    if (selected.size === 0) return;
    
    const selectedIds = Array.from(selected);
    const prevLinks = links;
    
    // Optimistic: сразу обновляем UI
    startTransition(() => {
      setLinks(prev => prev.map(l => 
        selectedIds.includes(l.id) ? { ...l, status: 'active' as LinkStatus } : l
      ));
      setSelected(new Set());
    });
    
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id =>
          fetch(`/api/admin/payment-links/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'active' }),
          }).then(res => res.ok ? res.json() : Promise.reject())
        )
      );
      
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        setError(`Не удалось восстановить ${failed} ссылок`);
        loadLinks();
      }
    } catch {
      setLinks(prevLinks);
      setError('Ошибка');
    }
  }, [links, selected]);

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start sm:items-center justify-between gap-3 mb-4 lg:mb-6">
        <div className="min-w-0">
          <h1 className="text-lg lg:text-xl font-bold text-text-primary truncate">Платёжные ссылки</h1>
          <p className="text-xs lg:text-sm text-text-secondary mt-0.5 hidden sm:block">
            Создавайте ссылки для быстрой оплаты
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => loadLinks()}
            className="p-2 text-text-secondary hover:text-action hover:bg-action/10 rounded-lg transition-colors"
            title="Обновить"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-action text-white text-xs lg:text-sm font-medium rounded-lg hover:bg-action/90 transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Создать</span>
          </button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-zinc-100 rounded-lg w-fit">
        {[
          { key: 'active', label: 'Активные', count: counts.active },
          { key: 'archive', label: 'Архив', count: counts.archive },
          { key: 'all', label: 'Все', count: counts.all },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key as FilterType)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5',
              filter === key
                ? 'bg-white text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {label}
            <span className={cn(
              'px-1.5 py-0.5 rounded-full text-[10px]',
              filter === key ? 'bg-action/10 text-action' : 'bg-zinc-200 text-zinc-500'
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Панель массовых действий */}
      {selected.size > 0 && (
        <div className="mb-4 p-3 bg-action/5 border border-action/20 rounded-lg flex items-center justify-between gap-3">
          <span className="text-sm text-text-primary">
            Выбрано: <strong>{selected.size}</strong>
            {isPending && <span className="ml-2 text-text-secondary">(обновление...)</span>}
          </span>
          <div className="flex items-center gap-2">
            {filter === 'active' ? (
              <button
                onClick={handleBulkArchive}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
              >
                В архив
              </button>
            ) : (
              <button
                onClick={handleBulkRestore}
                disabled={isPending}
                className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors disabled:opacity-50"
              >
                Восстановить
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              disabled={isPending}
              className="px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Удалить
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span className="flex-1 min-w-0 truncate">{error}</span>
          <button onClick={() => setError('')} className="text-red-500 hover:text-red-700 shrink-0">×</button>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50">
          <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-xl w-full sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-border-main flex items-center justify-between shrink-0">
              <h2 className="text-base font-semibold text-text-primary">Новая ссылка</h2>
              <button onClick={() => setShowCreate(false)} className="text-text-secondary text-xl leading-none">×</button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              {/* Сумма */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Сумма (₽) *</label>
                <input
                  type="number"
                  min={10}
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-border-main rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action"
                />
              </div>

              {/* Описание */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Описание *</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2.5 border border-border-main rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-action/20 focus:border-action resize-none"
                  placeholder="За что оплата"
                />
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[11px] text-amber-800">
                    ⚠️ Описание должно соответствовать законодательству о продажах и патентной системе.
                  </p>
                </div>
              </div>

              {/* Способы оплаты */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Способы оплаты</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'allowSbp', label: 'СБП' },
                    { key: 'allowCard', label: 'Карта' },
                    { key: 'allowTpay', label: 'T-Pay' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={cn(
                        'px-3 py-2 border rounded-lg text-sm cursor-pointer transition-colors',
                        form[key as keyof typeof form]
                          ? 'bg-action/10 border-action text-action'
                          : 'border-border-main text-text-secondary'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={form[key as keyof typeof form] as boolean}
                        onChange={e => setForm({ ...form, [key]: e.target.checked })}
                        className="sr-only"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Авторизация */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresAuth}
                  onChange={e => setForm({ ...form, requiresAuth: e.target.checked })}
                  className="w-4 h-4 rounded border-border-main text-action"
                />
                <span className="text-sm text-text-primary">Требуется авторизация</span>
              </label>

              {/* Тип */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Лимит</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'single', label: '1×' },
                    { value: 'limited', label: 'N×' },
                    { value: 'unlimited', label: '∞' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm({ ...form, usageType: value as any })}
                      className={cn(
                        'py-2.5 border rounded-lg text-sm font-medium transition-colors',
                        form.usageType === value
                          ? 'bg-action text-white border-action'
                          : 'border-border-main text-text-secondary hover:border-action/50'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {form.usageType === 'limited' && (
                  <input
                    type="number"
                    min={1}
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: Number(e.target.value) })}
                    placeholder="Количество"
                    className="mt-2 w-full px-3 py-2.5 border border-border-main rounded-lg text-sm"
                  />
                )}
              </div>

              {/* Срок */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">Истекает</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                  className="w-full px-3 py-2.5 border border-border-main rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="p-4 border-t border-border-main flex gap-3 shrink-0">
              <button
                onClick={() => setShowCreate(false)}
                className="flex-1 py-2.5 text-sm text-text-secondary border border-border-main rounded-lg"
              >
                Отмена
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="flex-1 py-2.5 bg-action text-white text-sm font-medium rounded-lg disabled:opacity-50"
              >
                {creating ? '...' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Content */}
      {loading ? (
        <PaymentLinksSkeleton />
      ) : filteredLinks.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary mb-3 text-sm">
            {filter === 'active' ? 'Нет активных ссылок' : filter === 'archive' ? 'Архив пуст' : 'Нет ссылок'}
          </p>
          {filter !== 'archive' && (
            <button onClick={() => setShowCreate(true)} className="text-action text-sm">+ Создать</button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white border border-border-main rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-main bg-zinc-50">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={filteredLinks.length > 0 && selected.size === filteredLinks.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-zinc-300 text-action focus:ring-action/20"
                    />
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Описание</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Сумма</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Способы</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Лимит</th>
                  <th className="text-left px-4 py-3 font-medium text-text-secondary">Статус</th>
                  <th className="text-right px-4 py-3 font-medium text-text-secondary">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map(link => (
                  <tr key={link.id} className={cn(
                    "border-b border-border-main last:border-0 hover:bg-zinc-50/50",
                    selected.has(link.id) && "bg-action/5"
                  )}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(link.id)}
                        onChange={() => toggleSelect(link.id)}
                        className="w-4 h-4 rounded border-zinc-300 text-action focus:ring-action/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-text-primary line-clamp-1 max-w-[200px]">{link.description}</div>
                      <div className="text-xs text-text-secondary mt-0.5 font-mono">{link.code}</div>
                    </td>
                    <td className="px-4 py-3 font-medium text-text-primary whitespace-nowrap">
                      {link.amount.toLocaleString('ru-RU')} ₽
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {link.allowSbp && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">СБП</span>}
                        {link.allowCard && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-[10px] rounded">Карта</span>}
                        {link.allowTpay && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded">T-Pay</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                      {getUsageLabel(link)}
                      {link.requiresAuth && <span className="ml-1">🔒</span>}
                    </td>
                    <td className="px-4 py-3">{getStatusBadge(link.status)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => copyLink(link.code, link.id)} className="p-1.5 text-text-secondary hover:text-action hover:bg-action/10 rounded" title="Копировать">
                          {copiedId === link.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                        <a href={`/pay/${link.code}`} target="_blank" rel="noopener noreferrer" className="p-1.5 text-text-secondary hover:text-action hover:bg-action/10 rounded">
                          <ExternalLink size={16} />
                        </a>
                        <a href={`/admin/payment-links/${link.id}`} className="p-1.5 text-text-secondary hover:text-action hover:bg-action/10 rounded">
                          <Eye size={16} />
                        </a>
                        {link.status === 'active' && (
                          <button onClick={() => handleArchive(link)} className="p-1.5 text-text-secondary hover:text-amber-600 hover:bg-amber-50 rounded" title="В архив">
                            <Archive size={16} />
                          </button>
                        )}
                        <button onClick={() => handleToggleStatus(link)} className={cn('px-2 py-1 text-xs rounded', link.status === 'active' ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50')}>
                          {link.status === 'active' ? 'Откл.' : 'Вкл.'}
                        </button>
                        <button onClick={() => handleDelete(link.id)} className="p-1.5 text-text-secondary hover:text-red-600 hover:bg-red-50 rounded" title="Удалить">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {filteredLinks.map(link => (
              <div key={link.id} className={cn(
                "bg-white border rounded-xl p-4",
                selected.has(link.id) ? "border-action bg-action/5" : "border-border-main"
              )}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selected.has(link.id)}
                      onChange={() => toggleSelect(link.id)}
                      className="w-4 h-4 mt-0.5 rounded border-zinc-300 text-action focus:ring-action/20 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-medium text-text-primary text-sm line-clamp-2">{link.description}</div>
                      <div className="text-xs text-text-secondary mt-1 font-mono">{link.code}</div>
                    </div>
                  </div>
                  <div className="relative shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpenMenu(openMenu === link.id ? null : link.id); }}
                      className="p-1.5 text-text-secondary hover:bg-zinc-100 rounded"
                    >
                      <MoreVertical size={18} />
                    </button>
                    {openMenu === link.id && (
                      <div className="absolute right-0 top-full mt-1 bg-white border border-border-main rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                        <button onClick={() => { copyLink(link.code, link.id); setOpenMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2">
                          <Copy size={14} /> Копировать
                        </button>
                        <a href={`/pay/${link.code}`} target="_blank" rel="noopener noreferrer" className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2">
                          <ExternalLink size={14} /> Открыть
                        </a>
                        <a href={`/admin/payment-links/${link.id}`} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 flex items-center gap-2">
                          <Eye size={14} /> Подробнее
                        </a>
                        {link.status === 'active' && (
                          <button onClick={() => { handleArchive(link); setOpenMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 text-amber-600 flex items-center gap-2">
                            <Archive size={14} /> В архив
                          </button>
                        )}
                        <button onClick={() => { handleToggleStatus(link); setOpenMenu(null); }} className={cn('w-full px-3 py-2 text-left text-sm hover:bg-zinc-50', link.status === 'active' ? 'text-red-600' : 'text-emerald-600')}>
                          {link.status === 'active' ? 'Отключить' : 'Включить'}
                        </button>
                        <button onClick={() => { handleDelete(link.id); setOpenMenu(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-zinc-50 text-red-600 flex items-center gap-2">
                          <Trash2 size={14} /> Удалить
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-text-primary">{link.amount.toLocaleString('ru-RU')} ₽</span>
                    {getStatusBadge(link.status)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                    <span>{getUsageLabel(link)}</span>
                    {link.requiresAuth && <span>🔒</span>}
                  </div>
                </div>
                
                <div className="flex gap-1 mt-3 pt-3 border-t border-border-main">
                  {link.allowSbp && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] rounded">СБП</span>}
                  {link.allowCard && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-[10px] rounded">Карта</span>}
                  {link.allowTpay && <span className="px-2 py-1 bg-yellow-50 text-yellow-700 text-[10px] rounded">T-Pay</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Обёртка с Suspense для useSearchParams
export default function PaymentLinksPage() {
  return (
    <Suspense fallback={<div className="p-4 lg:p-6 max-w-6xl mx-auto"><PaymentLinksSkeleton /></div>}>
      <PaymentLinksContent />
    </Suspense>
  );
}
