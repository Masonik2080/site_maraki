// components/shop/user-menu.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AuthClientService } from '@/lib/services/auth.client';
import { User, LogOut, Settings, BookOpen, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  user: {
    email: string;
    fullName?: string | null;
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await AuthClientService.logout();
    router.push('/');
    router.refresh();
  };

  const displayName = user.fullName || user.email.split('@')[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-[--color-zinc-100] transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[--color-zinc-200] flex items-center justify-center">
          <User className="w-4 h-4 text-text-secondary" />
        </div>
        <span className="text-sm font-medium text-text-primary hidden sm:block max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDown className="w-4 h-4 text-text-secondary" />
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-1 w-48 bg-[--color-page-bg] border border-border-main rounded-lg shadow-lg z-50 py-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[--color-zinc-50] transition-colors"
              onClick={() => setOpen(false)}
            >
              <BookOpen className="w-4 h-4" />
              Мои курсы
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-[--color-zinc-50] transition-colors"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Настройки
            </Link>
            <div className="border-t border-border-main my-1" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Выйти
            </button>
          </div>
        </>
      )}
    </div>
  );
}
