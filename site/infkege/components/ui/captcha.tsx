'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { RefreshCw, Check, Shield, Loader2, X } from 'lucide-react';

const HONEYPOT_FIELDS = {
  email: '_cf_email_verify',
  phone: '_cf_phone_backup', 
  website: '_cf_url_ref',
};

interface CaptchaData {
  image: string;
  token: string;
  task: string;
  canvasSize: number;
  targetCount: number;
}

interface ClickPoint {
  x: number;
  y: number;
  id: number;
}

interface MouseMovement {
  x: number;
  y: number;
  t: number;
}

export interface CaptchaRef {
  getVerificationToken: () => string | null;
  reset: () => void;
  isVerified: () => boolean;
}

interface CaptchaProps {
  onVerified?: (token: string) => void;
  onValidChange?: (isValid: boolean) => void;
  captchaRef?: React.MutableRefObject<CaptchaRef | null>;
}

export function Captcha({ onVerified, onValidChange, captchaRef }: CaptchaProps) {
  const [captchaData, setCaptchaData] = useState<CaptchaData | null>(null);
  const [clicks, setClicks] = useState<ClickPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  
  // Honeypot
  const [honeypotEmail, setHoneypotEmail] = useState('');
  const [honeypotPhone, setHoneypotPhone] = useState('');
  const [honeypotWebsite, setHoneypotWebsite] = useState('');

  // Поведенческая аналитика
  const mouseMovements = useRef<MouseMovement[]>([]);
  const lastMousePos = useRef<{ x: number; y: number; t: number } | null>(null);
  const teleportCount = useRef(0);
  const imageRef = useRef<HTMLDivElement>(null);
  const clickIdCounter = useRef(0);

  // Отслеживание движения мыши
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const t = Date.now();
    
    if (lastMousePos.current) {
      const dx = Math.abs(x - lastMousePos.current.x);
      const dy = Math.abs(y - lastMousePos.current.y);
      const dt = t - lastMousePos.current.t;
      
      // Детекция телепортации
      if ((dx > 80 || dy > 80) && dt < 10) {
        teleportCount.current++;
      }
    }
    
    // Сохраняем каждое 3-е движение
    if (mouseMovements.current.length % 3 === 0) {
      mouseMovements.current.push({ x: Math.round(x), y: Math.round(y), t });
    }
    
    if (mouseMovements.current.length > 150) {
      mouseMovements.current = mouseMovements.current.slice(-75);
    }
    
    lastMousePos.current = { x, y, t };
  }, []);

  // Загрузка капчи
  const loadCaptcha = useCallback(async () => {
    setLoading(true);
    setError(null);
    setClicks([]);
    setVerified(false);
    setVerificationToken(null);
    setWrongAttempts(0);
    mouseMovements.current = [];
    teleportCount.current = 0;
    lastMousePos.current = null;
    clickIdCounter.current = 0;
    onValidChange?.(false);

    try {
      const response = await fetch('/api/captcha/generate');
      if (!response.ok) throw new Error('Failed to load captcha');
      
      const data = await response.json();
      setCaptchaData(data);
    } catch (err) {
      setError('Не удалось загрузить капчу');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onValidChange]);

  useEffect(() => {
    loadCaptcha();
  }, [loadCaptcha]);

  // Клик по изображению
  const handleImageClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (verified || verifying || !captchaData) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Масштабирование координат если изображение отмасштабировано
    const scaleX = captchaData.canvasSize / rect.width;
    const scaleY = captchaData.canvasSize / rect.height;
    
    const scaledX = Math.round(x * scaleX);
    const scaledY = Math.round(y * scaleY);
    
    // Проверяем, не кликнули ли рядом с существующей точкой (для удаления)
    const clickRadius = 20;
    const existingClickIndex = clicks.findIndex(click => {
      const dx = (click.x / scaleX) - x;
      const dy = (click.y / scaleY) - y;
      return Math.sqrt(dx * dx + dy * dy) < clickRadius;
    });
    
    if (existingClickIndex !== -1) {
      // Удаляем существующий клик
      setClicks(prev => prev.filter((_, i) => i !== existingClickIndex));
    } else {
      // Добавляем новый клик
      setClicks(prev => [...prev, { x: scaledX, y: scaledY, id: clickIdCounter.current++ }]);
    }
    
    setError(null);
  }, [verified, verifying, captchaData, clicks]);

  // Верификация
  const verifyCaptcha = useCallback(async () => {
    if (!captchaData || clicks.length === 0) return;

    setVerifying(true);
    setError(null);

    try {
      const behaviorHash = btoa(JSON.stringify({
        moveCount: mouseMovements.current.length,
        teleports: teleportCount.current,
        duration: mouseMovements.current.length > 1 
          ? mouseMovements.current[mouseMovements.current.length - 1].t - mouseMovements.current[0].t 
          : 0,
      }));

      const response = await fetch('/api/captcha/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: captchaData.token,
          clicks: clicks.map(c => ({ x: c.x, y: c.y })),
          honeypot: {
            email: honeypotEmail,
            phone: honeypotPhone,
            website: honeypotWebsite,
          },
          behavior: {
            hash: behaviorHash,
          },
        }),
      });

      const result = await response.json();

      if (result.valid) {
        setVerified(true);
        setVerificationToken(result.verificationToken);
        onVerified?.(result.verificationToken);
        onValidChange?.(true);
      } else {
        setError(result.error || 'Неверный выбор');
        setWrongAttempts(prev => prev + 1);
        
        if (wrongAttempts >= 2) {
          setTimeout(loadCaptcha, 1000);
        }
      }
    } catch (err) {
      setError('Ошибка проверки');
      console.error(err);
    } finally {
      setVerifying(false);
    }
  }, [captchaData, clicks, honeypotEmail, honeypotPhone, honeypotWebsite, wrongAttempts, loadCaptcha, onVerified, onValidChange]);

  // Expose ref
  useEffect(() => {
    if (captchaRef) {
      captchaRef.current = {
        getVerificationToken: () => verificationToken,
        reset: loadCaptcha,
        isVerified: () => verified,
      };
    }
  }, [captchaRef, verificationToken, verified, loadCaptcha]);

  return (
    <div className="space-y-3">
      {/* Honeypot */}
      <div
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          width: '1px',
          height: '1px',
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <input
          type="email"
          name={HONEYPOT_FIELDS.email}
          value={honeypotEmail}
          onChange={(e) => setHoneypotEmail(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
        <input
          type="tel"
          name={HONEYPOT_FIELDS.phone}
          value={honeypotPhone}
          onChange={(e) => setHoneypotPhone(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
        <input
          type="url"
          name={HONEYPOT_FIELDS.website}
          value={honeypotWebsite}
          onChange={(e) => setHoneypotWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Капча */}
      <div className={`relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
        verified 
          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' 
          : 'border-border-main bg-gradient-to-br from-[--color-zinc-50] to-[--color-zinc-100] dark:from-[--color-zinc-900] dark:to-[--color-zinc-800]'
      }`}>
        {/* Заголовок */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-main/50">
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg ${verified ? 'bg-emerald-500' : 'bg-action'}`}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">
                {verified ? 'Проверка пройдена!' : 'Проверка безопасности'}
              </p>
              {!verified && captchaData && (
                <p className="text-xs text-text-secondary">
                  {captchaData.task}
                </p>
              )}
            </div>
          </div>
          {!verified && (
            <button
              type="button"
              onClick={loadCaptcha}
              disabled={loading}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-[--color-zinc-200] dark:hover:bg-[--color-zinc-700] rounded-xl transition-all hover:rotate-180 duration-300 disabled:opacity-50"
              title="Новая капча"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Контент */}
        <div className="p-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
            </div>
          ) : verified ? (
            <div className="flex items-center justify-center py-6 gap-3">
              <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center animate-bounce">
                <Check className="w-6 h-6 text-white" />
              </div>
              <span className="text-lg font-medium text-emerald-600 dark:text-emerald-400">
                Отлично!
              </span>
            </div>
          ) : captchaData ? (
            <div className="relative">
              {/* Изображение с кликами */}
              <div 
                ref={imageRef}
                className="relative mx-auto select-none cursor-crosshair"
                style={{ 
                  width: captchaData.canvasSize,
                  maxWidth: '100%',
                  aspectRatio: '1',
                }}
                onClick={handleImageClick}
                onMouseMove={handleMouseMove}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={captchaData.image}
                  alt="Captcha"
                  className="w-full h-full rounded-lg pointer-events-none"
                  draggable={false}
                />
                
                {/* Маркеры кликов */}
                {clicks.map((click, index) => {
                  const rect = imageRef.current?.getBoundingClientRect();
                  if (!rect) return null;
                  
                  const scaleX = rect.width / captchaData.canvasSize;
                  const scaleY = rect.height / captchaData.canvasSize;
                  
                  return (
                    <div
                      key={click.id}
                      className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-action border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold pointer-events-none"
                      style={{
                        left: click.x * scaleX,
                        top: click.y * scaleY,
                      }}
                    >
                      {index + 1}
                    </div>
                  );
                })}
              </div>

              {/* Инфо и кнопки */}
              <div className="mt-3 flex items-center justify-between">
                <div className="text-xs text-text-secondary">
                  Выбрано: {clicks.length} / {captchaData.targetCount}
                  {clicks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setClicks([])}
                      className="ml-2 text-red-500 hover:text-red-600"
                    >
                      <X className="w-3 h-3 inline" /> Сбросить
                    </button>
                  )}
                </div>
              </div>

              {/* Кнопка */}
              <button
                type="button"
                onClick={verifyCaptcha}
                disabled={clicks.length === 0 || verifying}
                className="mt-3 w-full py-2.5 px-4 bg-action text-white rounded-xl font-medium text-sm
                  hover:bg-action/90 disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Проверка...
                  </>
                ) : (
                  'Подтвердить'
                )}
              </button>
            </div>
          ) : null}

          {/* Ошибка */}
          {error && (
            <div className="mt-2 text-sm text-red-500 text-center">
              {error}
              {wrongAttempts > 0 && wrongAttempts < 3 && (
                <span className="text-text-secondary ml-1">
                  (попытка {wrongAttempts}/3)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {verificationToken && (
        <input type="hidden" name="_captcha_token" value={verificationToken} />
      )}
    </div>
  );
}

export { HONEYPOT_FIELDS };
