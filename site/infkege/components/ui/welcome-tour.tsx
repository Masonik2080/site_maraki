'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Home,
  ShoppingBag,
  LayoutDashboard,
  Sun,
  PartyPopper,
  RefreshCw,
  UserPlus,
  BookOpen,
  Receipt,
  Settings,
  Clock,
  CheckCircle2,
  Play,
  Smartphone,
  Monitor,
} from 'lucide-react';

const TOUR_STORAGE_KEY = 'infkege_tour_v2_seen';
const TOUR_EXPIRY_DATE = new Date('2025-12-31T23:59:59');

type StepType = 'welcome' | 'highlight' | 'preview' | 'final' | 'info';

interface TourStep {
  type: StepType;
  title: string;
  description: string;
  icon?: React.ElementType;
  selector?: string;
  mobileSelector?: string;
  position?: 'top' | 'bottom';
  desktopOnly?: boolean;
  mobileOnly?: boolean;
}

// Шаги для десктопа
const desktopSteps: TourStep[] = [
  {
    type: 'welcome',
    title: 'Добро пожаловать в INFKEGE 2.0!',
    description: 'Мы полностью обновили сайт! Новый дизайн, удобная навигация и много полезных функций. Давайте покажу, что нового.',
    icon: PartyPopper,
  },
  {
    type: 'highlight',
    title: 'Новая навигация',
    description: 'Удобное меню всегда под рукой. Быстрый доступ ко всем разделам сайта.',
    icon: Sparkles,
    selector: 'nav.nav-glass',
    position: 'bottom',
  },
  {
    type: 'highlight',
    title: 'Главная страница',
    description: 'Информация обо мне, достижениях и отзывы учеников.',
    icon: Home,
    selector: 'nav.nav-glass a[href="/"]',
    position: 'bottom',
  },
  {
    type: 'highlight',
    title: 'Личный кабинет',
    description: 'Ваши курсы, прогресс обучения и история покупок.',
    icon: LayoutDashboard,
    selector: 'nav.nav-glass a[href="/dashboard"]',
    position: 'bottom',
  },
  {
    type: 'preview',
    title: 'Что внутри кабинета?',
    description: 'Посмотрите, как выглядит личный кабинет с курсами и покупками.',
    icon: LayoutDashboard,
  },
  {
    type: 'highlight',
    title: 'Магазин курсов',
    description: 'Курсы, сборники вариантов и консультации с удобными фильтрами.',
    icon: ShoppingBag,
    selector: 'nav.nav-glass a[href="/shop"]',
    position: 'bottom',
  },
  {
    type: 'highlight',
    title: 'Переключение темы',
    description: 'Светлая или тёмная — выбирайте, как удобнее.',
    icon: Sun,
    selector: '[data-theme-switcher]',
    position: 'bottom',
  },
  {
    type: 'final',
    title: 'Готовы начать!',
    description: 'Зарегистрируйтесь, чтобы получить доступ к курсам и начать подготовку к ЕГЭ.',
    icon: Rocket,
  },
];

// Упрощённые шаги для мобильных (без highlight, только модалки)
const mobileSteps: TourStep[] = [
  {
    type: 'welcome',
    title: 'Добро пожаловать в INFKEGE 2.0!',
    description: 'Мы полностью обновили сайт! Новый дизайн, удобная навигация и много полезных функций.',
    icon: PartyPopper,
  },
  {
    type: 'info',
    title: 'Навигация внизу экрана',
    description: 'Главная, Кабинет и Магазин — всё под рукой в нижней панели. Просто нажмите на нужный раздел.',
    icon: Smartphone,
  },
  {
    type: 'info',
    title: 'Разделы сайта',
    description: 'Главная — обо мне и отзывы. Кабинет — ваши курсы и покупки. Магазин — выбор курсов и материалов.',
    icon: Monitor,
  },
  {
    type: 'preview',
    title: 'Личный кабинет',
    description: 'Здесь будут ваши курсы, прогресс и история покупок.',
    icon: LayoutDashboard,
  },
  {
    type: 'final',
    title: 'Готовы начать!',
    description: 'Зарегистрируйтесь, чтобы получить доступ к курсам и начать подготовку к ЕГЭ.',
    icon: Rocket,
  },
];

interface SpotlightRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Фейковые данные для превью кабинета
const fakeCourses = [
  { name: 'Экспресс-курс: Быстрый старт', progress: 75, icon: Play },
  { name: 'Сборник вариантов ЕГЭ', progress: 30, icon: BookOpen },
];

const fakePurchases = [
  { name: 'Экспресс-курс', date: '10 дек', status: 'Оплачено' },
  { name: 'Консультация', date: '5 дек', status: 'Оплачено' },
];

export function WelcomeTour() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

  // Определяем мобильный или десктоп
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const steps = isMobile ? mobileSteps : desktopSteps;

  const updateSpotlight = useCallback(() => {
    const step = steps[currentStep];

    if (step.type !== 'highlight' || !step.selector || isMobile) {
      setSpotlightRect(null);
      return;
    }

    const element = document.querySelector(step.selector);
    if (!element) {
      setSpotlightRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = 8;

    setSpotlightRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    const tooltipWidth = 340;
    const gap = 16;
    const style: React.CSSProperties = { position: 'fixed' };

    if (step.position === 'bottom') {
      style.top = rect.bottom + gap;
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16));
    } else {
      style.top = rect.top - 200 - gap;
      style.left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16));
    }

    setTooltipStyle(style);
  }, [currentStep, steps, isMobile]);

  useEffect(() => {
    setMounted(true);

    const now = new Date();
    if (now > TOUR_EXPIRY_DATE) return;

    const seen = localStorage.getItem(TOUR_STORAGE_KEY);
    if (!seen) {
      const timer = setTimeout(() => setIsOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateSpotlight();

    window.addEventListener('resize', updateSpotlight);
    window.addEventListener('scroll', updateSpotlight);
    return () => {
      window.removeEventListener('resize', updateSpotlight);
      window.removeEventListener('scroll', updateSpotlight);
    };
  }, [isOpen, currentStep, updateSpotlight]);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
  };

  const handleRegister = () => {
    handleClose();
    router.push('/login');
  };

  if (!mounted) return null;

  const step = steps[currentStep];
  const Icon = step.icon || Sparkles;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isFullscreen = step.type !== 'highlight' || isMobile;

  // Preview компонент
  const PreviewContent = () => (
    <div className="space-y-3 mb-4">
      {/* Courses */}
      <div className="bg-[--color-zinc-50] dark:bg-black/20 rounded-xl p-3 border border-[--color-border-main]">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-4 h-4 text-[--color-action]" />
          <span className="text-xs font-semibold text-[--color-text-primary]">Мои курсы</span>
        </div>
        <div className="space-y-2">
          {fakeCourses.map((course, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[--color-action]/10 flex items-center justify-center shrink-0">
                <course.icon className="w-3.5 h-3.5 text-[--color-action]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-[--color-text-primary] truncate">{course.name}</div>
                <div className="h-1 bg-[--color-zinc-200] rounded-full mt-1">
                  <div className="h-full bg-[--color-action] rounded-full" style={{ width: `${course.progress}%` }} />
                </div>
              </div>
              <span className="text-[10px] text-[--color-text-secondary] shrink-0">{course.progress}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Purchases */}
      <div className="bg-[--color-zinc-50] dark:bg-black/20 rounded-xl p-3 border border-[--color-border-main]">
        <div className="flex items-center gap-2 mb-2">
          <Receipt className="w-4 h-4 text-[--color-action]" />
          <span className="text-xs font-semibold text-[--color-text-primary]">Покупки</span>
        </div>
        <div className="space-y-1.5">
          {fakePurchases.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-[--color-text-primary]">{p.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[--color-text-secondary]">{p.date}</span>
                <CheckCircle2 className="w-3 h-3 text-green-500" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="flex gap-2">
        {[
          { icon: Settings, label: 'Настройки' },
          { icon: Clock, label: 'Прогресс' },
        ].map((item, i) => (
          <div key={i} className="flex-1 flex items-center gap-1.5 p-2 rounded-lg bg-[--color-zinc-50] dark:bg-black/20 border border-[--color-border-main]">
            <item.icon className="w-3.5 h-3.5 text-[--color-text-secondary]" />
            <span className="text-[10px] text-[--color-text-secondary]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100]">
          {/* Overlay */}
          {step.type === 'highlight' && !isMobile && spotlightRect ? (
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  <motion.rect
                    initial={{ opacity: 0 }}
                    animate={{
                      x: spotlightRect.left,
                      y: spotlightRect.top,
                      width: spotlightRect.width,
                      height: spotlightRect.height,
                      opacity: 1,
                    }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    rx="12"
                    fill="black"
                  />
                </mask>
              </defs>
              <motion.rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.8)"
                mask="url(#spotlight-mask)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </svg>
          ) : (
            <motion.div
              className="absolute inset-0 bg-black/80"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}

          {/* Highlight border */}
          {spotlightRect && step.type === 'highlight' && !isMobile && (
            <motion.div
              className="absolute border-2 border-[--color-action] rounded-xl pointer-events-none"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: 1,
                top: spotlightRect.top,
                left: spotlightRect.left,
                width: spotlightRect.width,
                height: spotlightRect.height,
              }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' }}
            />
          )}

          {/* Fullscreen Modal */}
          {isFullscreen && (
            <div className="absolute inset-0 flex items-center justify-center p-4 pb-20 md:pb-4">
              <motion.div
                className="w-full max-w-md bg-white dark:bg-[#1a1a2e] rounded-2xl border border-[--color-border-main] shadow-2xl overflow-hidden"
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                key={currentStep}
              >
                {/* Progress */}
                <div className="h-1 bg-[--color-zinc-100]">
                  <motion.div
                    className="h-full bg-[--color-action]"
                    animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                  />
                </div>

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[--color-action]/10 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-[--color-action]" />
                      </div>
                      <h2 className="text-lg font-bold text-[--color-text-primary] leading-tight">{step.title}</h2>
                    </div>
                    <button onClick={handleClose} className="p-2 rounded-lg hover:bg-[--color-zinc-100] transition-colors shrink-0">
                      <X className="w-5 h-5 text-[--color-text-secondary]" />
                    </button>
                  </div>

                  <p className="text-sm text-[--color-text-secondary] mb-4">{step.description}</p>

                  {step.type === 'preview' && <PreviewContent />}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-[--color-border-main]">
                    <div className="flex gap-1">
                      {steps.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentStep(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === currentStep ? 'bg-[--color-action]' : 'bg-[--color-zinc-200]'}`}
                        />
                      ))}
                    </div>

                    <div className="flex gap-2">
                      {isFirstStep && (
                        <button onClick={handleClose} className="px-3 py-2 text-xs text-[--color-text-secondary] hover:text-[--color-text-primary]">
                          Пропустить
                        </button>
                      )}
                      {!isFirstStep && (
                        <button onClick={handlePrev} className="flex items-center gap-1 px-3 py-2 text-xs text-[--color-text-secondary] hover:bg-[--color-zinc-100] rounded-lg">
                          <ArrowLeft className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isLastStep ? (
                        <>
                          <button onClick={handleRestart} className="flex items-center gap-1 px-3 py-2 text-xs text-[--color-text-secondary] hover:bg-[--color-zinc-100] rounded-lg">
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={handleRegister} className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-[--color-action] text-[--color-action-text] rounded-lg">
                            <UserPlus className="w-3.5 h-3.5" />
                            Войти
                          </button>
                        </>
                      ) : (
                        <button onClick={handleNext} className="flex items-center gap-1 px-4 py-2 text-xs font-medium bg-[--color-action] text-[--color-action-text] rounded-lg">
                          Далее
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Desktop Highlight Tooltip */}
          {step.type === 'highlight' && !isMobile && spotlightRect && (
            <motion.div
              className="absolute w-[340px]"
              style={tooltipStyle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={currentStep}
            >
              <div className="bg-white dark:bg-[#1a1a2e] rounded-xl border border-[--color-border-main] shadow-2xl overflow-hidden">
                <div className="h-1 bg-[--color-zinc-100]">
                  <motion.div className="h-full bg-[--color-action]" animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }} />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-[--color-action]/10 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-[--color-action]" />
                    </div>
                    <h3 className="font-bold text-[--color-text-primary]">{step.title}</h3>
                  </div>
                  <p className="text-sm text-[--color-text-secondary] mb-4">{step.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {steps.map((_, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? 'bg-[--color-action]' : 'bg-[--color-zinc-200]'}`} />
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handlePrev} className="p-2 text-[--color-text-secondary] hover:bg-[--color-zinc-100] rounded-lg">
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <button onClick={handleNext} className="flex items-center gap-1 px-3 py-2 text-xs font-medium bg-[--color-action] text-[--color-action-text] rounded-lg">
                        Далее
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-[#1a1a2e] border-l border-t border-[--color-border-main] rotate-45" />
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
