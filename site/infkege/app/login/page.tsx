'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthClientService } from '@/lib/services/auth.client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Captcha, CaptchaRef } from '@/components/ui/captcha';
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, refresh } = useAuth();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const errorParam = searchParams.get('error');

  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(
    errorParam === 'auth_failed' ? { text: 'Ошибка авторизации. Попробуйте снова.', type: 'error' } : null
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<CaptchaRef | null>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectTo);
    }
  }, [user, authLoading, router, redirectTo]);

  const handleCaptchaVerified = (token: string) => {
    setCaptchaToken(token);
    setCaptchaVerified(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Проверка капчи
    if (!captchaRef.current?.isVerified() || !captchaToken) {
      setMessage({ text: 'Пройдите проверку безопасности', type: 'error' });
      setLoading(false);
      return;
    }

    if (mode === 'login') {
      const result = await AuthClientService.login(email, password, captchaToken);
      
      if (result.success) {
        await refresh();
        router.push(redirectTo);
      } else {
        setMessage({ text: result.error || 'Ошибка входа', type: 'error' });
        captchaRef.current?.reset();
        setCaptchaVerified(false);
        setCaptchaToken(null);
      }
    } else {
      if (password.length < 6) {
        setMessage({ text: 'Пароль должен быть не менее 6 символов', type: 'error' });
        setLoading(false);
        return;
      }

      const result = await AuthClientService.register(email, password, fullName, captchaToken);
      
      if (result.success) {
        if (result.needsConfirmation) {
          setMessage({ text: 'Проверьте почту для подтверждения аккаунта', type: 'success' });
        } else {
          await refresh();
          router.push(redirectTo);
        }
      } else {
        setMessage({ text: result.error || 'Ошибка регистрации', type: 'error' });
        captchaRef.current?.reset();
        setCaptchaVerified(false);
        setCaptchaToken(null);
      }
    }

    setLoading(false);
  };

  const handleGoogleLogin = () => {
    AuthClientService.loginWithGoogle(redirectTo);
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-text-secondary" />
      </div>
    );
  }

  // Don't render if already logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-2xl font-bold tracking-tight bg-gradient-to-r from-action to-action/70 bg-clip-text text-transparent">
              InfKege
            </span>
          </Link>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            {mode === 'login' ? 'С возвращением!' : 'Создайте аккаунт'}
          </h1>
          <p className="text-sm text-text-secondary">
            {mode === 'login' 
              ? 'Войдите, чтобы продолжить обучение' 
              : 'Зарегистрируйтесь для доступа к курсам'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[--color-page-bg] border border-border-main rounded-2xl p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-[--color-zinc-100] rounded-xl mb-6">
            <button
              type="button"
              onClick={() => { setMode('login'); setMessage(null); }}
              className={`flex-1 text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-[--color-page-bg] text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Вход
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setMessage(null); }}
              className={`flex-1 text-sm font-medium py-2.5 px-4 rounded-lg transition-all ${
                mode === 'register'
                  ? 'bg-[--color-page-bg] text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Регистрация
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Имя
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    type="text"
                    placeholder="Ваше имя"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 pl-10"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-1.5">
                Пароль
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="h-11 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === 'register' && (
                <p className="text-xs text-text-secondary mt-1.5">Минимум 6 символов</p>
              )}
            </div>

            {/* Капча */}
            <Captcha 
              captchaRef={captchaRef} 
              onVerified={handleCaptchaVerified}
              onValidChange={setCaptchaVerified} 
            />

            {message && (
              <div
                className={`text-sm p-3 rounded-lg ${
                  message.type === 'error'
                    ? 'bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30'
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30'
                }`}
              >
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full h-11" disabled={loading || !captchaVerified}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border-main" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[--color-page-bg] px-3 text-xs text-text-secondary">
                или продолжить с
              </span>
            </div>
          </div>

          {/* OAuth */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogleLogin}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </Button>

          {mode === 'login' && (
            <div className="mt-4 text-center">
              <Link
                href="/forgot-password"
                className="text-sm text-text-secondary hover:text-action transition-colors"
              >
                Забыли пароль?
              </Link>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-secondary mt-6">
          Продолжая, вы соглашаетесь с{' '}
          <Link href="/terms" className="underline hover:text-text-primary">
            условиями использования
          </Link>
        </p>
      </div>
    </div>
  );
}
