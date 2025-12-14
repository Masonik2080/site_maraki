'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Mail, ArrowLeft, CheckCircle, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';

type Step = 'email' | 'code' | 'newPassword' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const codeInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first code input when step changes to 'code'
  useEffect(() => {
    if (step === 'code') {
      codeInputRefs.current[0]?.focus();
    }
  }, [step]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/forgot-password`,
      });

      if (error) throw error;
      setStep('code');
    } catch (err: any) {
      setError(err.message || 'Ошибка отправки кода');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      codeInputRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus();
    }
  };

  const handleCodePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 6) {
      setCode(pastedData.split(''));
      codeInputRefs.current[5]?.focus();
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('Введите 6-значный код');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: fullCode,
        type: 'recovery',
      });

      if (error) throw error;
      setStep('newPassword');
    } catch (err: any) {
      setError('Неверный код. Проверьте и попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      setStep('success');
    } catch (err: any) {
      setError(err.message || 'Ошибка смены пароля');
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (step === 'success') {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-semibold text-text-primary mb-2">
            Пароль изменён!
          </h1>
          <p className="text-text-secondary mb-8">
            Теперь вы можете войти с новым паролем
          </p>
          <Button onClick={() => router.push('/login')} className="h-11 px-8">
            Войти в аккаунт
          </Button>
        </div>
      </div>
    );
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
            {step === 'email' && 'Восстановление пароля'}
            {step === 'code' && 'Введите код'}
            {step === 'newPassword' && 'Новый пароль'}
          </h1>
          <p className="text-sm text-text-secondary">
            {step === 'email' && 'Введите email, и мы отправим код для сброса'}
            {step === 'code' && `Код отправлен на ${email}`}
            {step === 'newPassword' && 'Придумайте новый пароль'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[--color-page-bg] border border-border-main rounded-2xl p-6 shadow-sm">
          
          {/* Step 1: Email */}
          {step === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4">
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

              {error && (
                <div className="text-sm p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Отправить код
              </Button>
            </form>
          )}

          {/* Step 2: Code */}
          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-3 text-center">
                  Введите 6-значный код из письма
                </label>
                <div className="flex justify-center gap-2" onPaste={handleCodePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => { codeInputRefs.current[index] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(index, e)}
                      className="w-12 h-14 text-center text-2xl font-semibold border border-border-main rounded-xl bg-[--color-page-bg] text-text-primary focus:border-action focus:ring-2 focus:ring-action/20 outline-none transition-all"
                    />
                  ))}
                </div>
              </div>

              {error && (
                <div className="text-sm p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading || code.join('').length !== 6}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Подтвердить
              </Button>

              <button
                type="button"
                onClick={() => { setStep('email'); setCode(['', '', '', '', '', '']); setError(null); }}
                className="w-full text-sm text-text-secondary hover:text-action transition-colors"
              >
                Отправить код повторно
              </button>
            </form>
          )}

          {/* Step 3: New Password */}
          {step === 'newPassword' && (
            <form onSubmit={handleSetNewPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Новый пароль
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <p className="text-xs text-text-secondary mt-1.5">Минимум 6 символов</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-1.5">
                  Подтвердите пароль
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="h-11 pl-10"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 dark:bg-red-950/20 dark:border-red-900/30">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Сохранить пароль
              </Button>
            </form>
          )}

          {/* Back to login */}
          {step === 'email' && (
            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="text-sm text-text-secondary hover:text-action transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Вернуться к входу
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
