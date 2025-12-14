// components/dashboard/settings-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthClientService } from '@/lib/services/auth.client';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, LogOut, User, AtSign, Mail, Check } from 'lucide-react';

interface SettingsFormProps {
  initialData: {
    email: string;
    fullName: string;
    username: string;
  };
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter();
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const [fullName, setFullName] = useState(initialData.fullName);
  const [username, setUsername] = useState(initialData.username);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Ошибка сохранения');
      }

      setMessage({ text: 'Настройки сохранены', type: 'success' });
      await refresh();
      router.refresh();
    } catch (error: any) {
      setMessage({ text: error.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLogoutLoading(true);
    await AuthClientService.logout();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="space-y-5">
      {/* Profile Form */}
      <div className="border border-border-main rounded-xl p-5 bg-[--color-page-bg]">
        <h2 className="font-medium text-text-primary mb-5 flex items-center gap-2 text-sm">
          <User className="w-4 h-4 text-text-secondary" />
          Профиль
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input
                type="email"
                value={initialData.email}
                disabled
                className="h-11 pl-10 bg-[--color-zinc-50] cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              Email нельзя изменить
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Имя
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ваше имя"
                className="h-11 pl-10"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Никнейм
            </label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username"
                className="h-11 pl-10"
                pattern="^[a-zA-Z0-9_]{3,20}$"
              />
            </div>
            <p className="text-xs text-text-secondary mt-1.5">
              3-20 символов, только буквы, цифры и _
            </p>
          </div>

          {message && (
            <div
              className={`text-sm p-3 rounded-xl flex items-center gap-2 border ${
                message.type === 'error'
                  ? 'bg-red-500/10 text-red-500 border-red-500/20'
                  : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              }`}
            >
              {message.type === 'success' && <Check className="w-4 h-4" />}
              {message.text}
            </div>
          )}

          <Button type="submit" disabled={loading} className="h-11">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Сохранить изменения
          </Button>
        </form>
      </div>

      {/* Logout */}
      <div className="border border-border-main rounded-xl p-5 bg-[--color-bg-secondary]">
        <h2 className="font-medium text-text-primary mb-1.5 flex items-center gap-2 text-sm">
          <LogOut className="w-4 h-4 text-red-500" />
          Выход из аккаунта
        </h2>
        <p className="text-sm text-text-secondary mb-4">
          Вы будете перенаправлены на главную страницу
        </p>
        <Button 
          variant="outline" 
          onClick={handleLogout}
          disabled={logoutLoading}
          className="h-10 text-red-500 border-red-500/20 hover:bg-red-500/10"
        >
          {logoutLoading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Выйти
        </Button>
      </div>
    </div>
  );
}
