// app/dashboard/settings/page.tsx
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AuthRepository, UserRepository } from '@/lib/dao';
import { SettingsForm } from '@/components/dashboard/settings-form';

export const metadata = {
  title: 'Настройки — InfKege',
};

export default async function SettingsPage() {
  const user = await AuthRepository.getCurrentUser();
  
  if (!user) {
    redirect('/login?redirect=/dashboard/settings');
  }

  const profile = await UserRepository.getProfile(user.id);

  return (
    <div className="layout-container py-10 min-h-[80vh]">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-text-primary tracking-tight">
          Личный кабинет
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-border-main mb-8">
        <Link 
          href="/dashboard" 
          className="pb-3 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          Мои курсы
        </Link>
        <Link 
          href="/dashboard/purchases" 
          className="pb-3 border-b-2 border-transparent text-text-secondary hover:text-text-primary text-sm transition-colors"
        >
          История покупок
        </Link>
        <Link 
          href="/dashboard/settings" 
          className="pb-3 border-b-2 border-action text-action font-medium text-sm"
        >
          Настройки
        </Link>
      </div>

      {/* Settings */}
      <div className="max-w-xl">
        <SettingsForm 
          initialData={{
            email: user.email,
            fullName: profile?.fullName || '',
            username: profile?.username || '',
          }}
        />
      </div>
    </div>
  );
}
