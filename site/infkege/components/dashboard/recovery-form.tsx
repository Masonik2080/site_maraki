'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, X, Check, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface RecoveryFormProps {
  email: string;
}

interface RecoveryRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_comment?: string;
  selected_items: string[];
  created_at: string;
}

// Курсы с пакетами
const RECOVERY_ITEMS = [
  {
    id: 'sbornik',
    title: 'Электронный сборник вариантов уровня ЕГЭ',
    hasPackages: true,
    packages: [
      { id: 'pack-1', title: 'Пакет 1 (Варианты 1-25)' },
      { id: 'pack-2', title: 'Пакет 2 (Варианты 26-40)' },
      { id: 'pack-3', title: 'Пакет 3 (Варианты 41-50)' },
    ]
  },
  { id: 'mt-course', title: 'Экспресс-курс по заданию №12 (Машина Тьюринга)', hasPackages: false },
  { id: 'fast-start', title: 'Экспресс-курс «Быстрый старт»', hasPackages: false },
  { id: 'tutors', title: 'Обучение репетиторов', hasPackages: false },
];

export function RecoveryForm({ email }: RecoveryFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasDocuments, setHasDocuments] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [sbornikMode, setSbornikMode] = useState<'all' | 'packages' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<RecoveryRequest | null>(null);
  const [history, setHistory] = useState<RecoveryRequest[]>([]);

  // Загружаем заявки при монтировании
  useEffect(() => {
    fetch('/api/recovery')
      .then(res => res.json())
      .then(data => {
        if (data.request) {
          setPendingRequest(data.request);
        }
        if (data.history) {
          setHistory(data.history);
        }
      })
      .catch(() => {});
  }, []);

  const togglePackage = (pkgId: string) => {
    setSelectedItems(prev => 
      prev.includes(pkgId) ? prev.filter(i => i !== pkgId) : [...prev, pkgId]
    );
  };

  const toggleCourse = (courseId: string) => {
    setSelectedItems(prev => 
      prev.includes(courseId) ? prev.filter(i => i !== courseId) : [...prev, courseId]
    );
  };

  const handleSbornikAll = () => {
    if (sbornikMode === 'all') {
      setSbornikMode(null);
      setSelectedItems(prev => prev.filter(i => i !== 'sbornik-all'));
    } else {
      setSbornikMode('all');
      setSelectedItems(prev => [
        ...prev.filter(i => !i.startsWith('pack-')),
        'sbornik-all'
      ]);
    }
  };

  const handleSbornikPackages = () => {
    if (sbornikMode === 'packages') {
      setSbornikMode(null);
      setSelectedItems(prev => prev.filter(i => !i.startsWith('pack-')));
    } else {
      setSbornikMode('packages');
      setSelectedItems(prev => prev.filter(i => i !== 'sbornik-all'));
    }
  };

  const handleSubmit = async () => {
    if (selectedItems.length === 0 || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasDocuments,
          selectedItems,
          comment,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok && data.request) {
        setPendingRequest(data.request);
        setIsOpen(false);
        // Сбрасываем форму
        setSelectedItems([]);
        setComment('');
        setHasDocuments(false);
        setSbornikMode(null);
      } else {
        alert(data.error || 'Ошибка при отправке заявки');
      }
    } catch {
      alert('Ошибка при отправке заявки');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Хелпер для получения названий выбранных курсов
  const getItemNames = (items: string[]) => {
    const names: string[] = [];
    const sbornik = RECOVERY_ITEMS.find(c => c.id === 'sbornik')!;
    
    for (const item of items) {
      if (item === 'sbornik-all') {
        names.push('Сборник (полный)');
      } else if (item.startsWith('pack-')) {
        const pkg = sbornik.packages?.find(p => p.id === item);
        if (pkg) names.push(pkg.title);
      } else {
        const course = RECOVERY_ITEMS.find(c => c.id === item);
        if (course) names.push(course.title);
      }
    }
    return names;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Компонент карточки заявки
  const RequestCard = ({ request, isPending = false }: { request: RecoveryRequest; isPending?: boolean }) => {
    const statusConfig = {
      pending: {
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        label: 'В рассмотрении',
      },
      approved: {
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        label: 'Одобрена',
      },
      rejected: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: 'Отклонена',
      },
    };

    const config = statusConfig[request.status];
    const Icon = config.icon;
    const itemNames = getItemNames(request.selected_items || []);

    return (
      <div className={`border ${config.border} ${config.bg} rounded-lg p-4`}>
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <Icon className={`w-4 h-4 ${config.color} shrink-0`} />
            <span className={`text-sm font-medium ${config.color}`}>{config.label}</span>
          </div>
          <span className="text-xs text-text-secondary">{formatDate(request.created_at)}</span>
        </div>
        
        {itemNames.length > 0 && (
          <div className="mb-2">
            <span className="text-xs text-text-secondary">Запрошено: </span>
            <span className="text-xs text-text-primary">{itemNames.join(', ')}</span>
          </div>
        )}

        {request.status === 'pending' && (
          <p className="text-xs text-text-secondary">
            Ожидайте, мы проверим информацию и восстановим доступ в ближайшее время!
          </p>
        )}

        {request.status === 'rejected' && request.admin_comment && (
          <p className="text-xs text-text-secondary">
            Причина: {request.admin_comment}
          </p>
        )}
      </div>
    );
  };

  // Если есть активная заявка — показываем её + историю
  if (pendingRequest) {
    return (
      <div className="mt-12 space-y-4">
        <RequestCard request={pendingRequest} isPending />
        
        {history.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Предыдущие обращения
            </h4>
            {history.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Закрытая форма + история
  if (!isOpen) {
    return (
      <div className="mt-12 space-y-4">
        <div className="border border-border-main bg-[--color-page-bg] rounded-lg px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <AlertCircle className="w-4 h-4 text-text-secondary shrink-0" />
            <p className="text-sm text-text-secondary">
              Знаем, что некоторые курсы, которые вы оплатили, пропали. Заполните форму и мы восстановим доступ. С нас — щедрая награда.
            </p>
          </div>
          <Button 
            variant="outline" 
            className="shrink-0 h-8 text-xs px-3"
            onClick={() => setIsOpen(true)}
          >
            Заполнить форму
          </Button>
        </div>

        {history.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-medium text-text-secondary uppercase tracking-wide">
              Ваши обращения
            </h4>
            {history.map(req => (
              <RequestCard key={req.id} request={req} />
            ))}
          </div>
        )}
      </div>
    );
  }

  const sbornik = RECOVERY_ITEMS.find(c => c.id === 'sbornik')!;
  const otherCourses = RECOVERY_ITEMS.filter(c => c.id !== 'sbornik');

  return (
    <div className="mt-12 border border-border-main bg-[--color-page-bg] rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-medium text-text-primary">Восстановление доступа</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-text-secondary hover:text-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Email */}
      <div className="mb-4">
        <label className="block text-xs text-text-secondary mb-1.5">Ваш email</label>
        <Input 
          type="email" 
          value={email} 
          disabled 
          className="bg-[--color-card-bg] text-text-secondary"
        />
      </div>

      {/* Documents checkbox */}
      <div className="mb-5">
        <button 
          type="button"
          className="flex items-center gap-2.5 group"
          onClick={() => setHasDocuments(!hasDocuments)}
        >
          <div className={`
            w-4 h-4 rounded border flex items-center justify-center transition-all
            ${hasDocuments 
              ? 'bg-action border-action' 
              : 'border-border-main group-hover:border-text-secondary'
            }
          `}>
            {hasDocuments && <Check className="w-3 h-3 text-white" />}
          </div>
          <span className="text-sm text-text-primary">
            Есть документы, подтверждающие факт оплаты
          </span>
        </button>
      </div>

      {/* Courses selection */}
      <div className="mb-4">
        <label className="block text-xs text-text-secondary mb-2">Выберите, что пропало</label>
        <div className="space-y-3">
          
          {/* Сборник */}
          <div className="border border-border-main rounded-lg p-3">
            <div className="text-sm font-medium text-text-primary mb-2">{sbornik.title}</div>
            <div className="space-y-2">
              <button
                type="button"
                className="flex items-center gap-2.5 group w-full text-left"
                onClick={handleSbornikAll}
              >
                <div className={`
                  w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0
                  ${sbornikMode === 'all' 
                    ? 'border-action' 
                    : 'border-border-main group-hover:border-text-secondary'
                  }
                `}>
                  {sbornikMode === 'all' && <div className="w-2 h-2 rounded-full bg-action" />}
                </div>
                <span className="text-sm text-text-primary">Покупал весь сборник</span>
              </button>
              
              <button
                type="button"
                className="flex items-center gap-2.5 group w-full text-left"
                onClick={handleSbornikPackages}
              >
                <div className={`
                  w-4 h-4 rounded-full border flex items-center justify-center transition-all shrink-0
                  ${sbornikMode === 'packages' 
                    ? 'border-action' 
                    : 'border-border-main group-hover:border-text-secondary'
                  }
                `}>
                  {sbornikMode === 'packages' && <div className="w-2 h-2 rounded-full bg-action" />}
                </div>
                <span className="text-sm text-text-primary">Покупал отдельные пакеты</span>
              </button>

              {sbornikMode === 'packages' && (
                <div className="ml-6 pt-1 space-y-1.5">
                  {sbornik.packages?.map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      className="flex items-center gap-2.5 group w-full text-left"
                      onClick={() => togglePackage(pkg.id)}
                    >
                      <div className={`
                        w-3.5 h-3.5 rounded border flex items-center justify-center transition-all shrink-0
                        ${selectedItems.includes(pkg.id) 
                          ? 'bg-action border-action' 
                          : 'border-border-main group-hover:border-text-secondary'
                        }
                      `}>
                        {selectedItems.includes(pkg.id) && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs text-text-secondary">{pkg.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Остальные курсы */}
          {otherCourses.map(course => (
            <button
              key={course.id}
              type="button"
              className="flex items-center gap-2.5 group w-full text-left"
              onClick={() => toggleCourse(course.id)}
            >
              <div className={`
                w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
                ${selectedItems.includes(course.id) 
                  ? 'bg-action border-action' 
                  : 'border-border-main group-hover:border-text-secondary'
                }
              `}>
                {selectedItems.includes(course.id) && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-text-primary">{course.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="block text-xs text-text-secondary mb-1.5">Комментарий</label>
        <textarea 
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Здесь вы можете оставить комментарий..."
          className="
            flex w-full rounded-md px-3 py-2 text-sm transition-all duration-200 min-h-[80px] resize-none
            bg-[--color-page-bg] border border-[--color-border-main] text-[--color-text-primary]
            placeholder:text-[--color-text-secondary] outline-none 
            focus:border-[--color-action] focus:ring-2 focus:ring-[--color-action] focus:ring-opacity-20
          "
        />
      </div>

      {/* Warning */}
      <div className="flex items-start gap-2 mb-5 text-text-secondary">
        <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <p className="text-xs leading-relaxed">
          Мы проверяем каждую заявку вручную. Пожалуйста, указывайте только те курсы, которые вы действительно приобретали. Спасибо за понимание.
        </p>
      </div>

      {/* Submit */}
      <Button 
        className="w-full h-9 text-sm"
        disabled={selectedItems.length === 0 || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить'}
      </Button>
    </div>
  );
}
