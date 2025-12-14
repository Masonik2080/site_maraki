// components/ui/layout/floating-nav.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, LayoutDashboard, ShoppingBag, ShoppingCart, User, LogOut, Settings, ChevronDown, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeSwitcher } from '@/components/ui/theme-switcher';
import { useAuth } from '@/components/providers/auth-provider';
import { AuthClientService } from '@/lib/services/auth.client';
import { CartButton } from '@/components/shop/cart-button';
import { motion, AnimatePresence } from 'framer-motion';

const NAV_ITEMS = [
  { label: 'Главная', href: '/', icon: Home },
  { label: 'Кабинет', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Магазин', href: '/shop', icon: ShoppingBag },
];

// Мягкая пружинная анимация
const spring = {
  type: "spring" as const,
  stiffness: 500,
  damping: 30,
};

export function FloatingNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch - auth state differs between server and client
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await AuthClientService.logout();
    setMenuOpen(false);
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
    setLoggingOut(false);
  };

  const displayName = user?.fullName || user?.email?.split('@')[0] || '';

  return (
    <>
      {/* Desktop Navigation */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700 hidden md:block">
        <nav className="nav-glass flex items-center gap-1 p-1.5 bg-[--color-bg-secondary]/95 backdrop-blur-xl border border-[--color-border-main] rounded-full shadow-lg">
          
          {/* Main Links */}
          <ul className="flex items-center gap-1 relative">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              const isHovered = hoveredItem === item.href;
              
              return (
                <li key={item.href} className="relative">
                  {/* Animated background pill */}
                  <AnimatePresence>
                    {(isHovered || isActive) && (
                      <motion.div
                        className={cn(
                          "absolute inset-0 rounded-full",
                          isActive ? "bg-[--color-zinc-100]" : "bg-[--color-zinc-50]"
                        )}
                        layoutId="nav-pill"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={spring}
                      />
                    )}
                  </AnimatePresence>
                  
                  <Link
                    href={item.href}
                    onMouseEnter={() => setHoveredItem(item.href)}
                    onMouseLeave={() => setHoveredItem(null)}
                    className={cn(
                      'group relative flex items-center gap-2 px-3 py-2 rounded-full border border-transparent z-10',
                      isActive 
                        ? 'text-text-primary font-medium' 
                        : 'text-text-secondary hover:text-text-primary'
                    )}
                  >
                    <motion.div
                      animate={{ scale: isHovered || isActive ? 1.1 : 1 }}
                      transition={spring}
                    >
                      <Icon size={18} strokeWidth={2} className="shrink-0" />
                    </motion.div>
                    
                    <motion.span 
                      className="overflow-hidden whitespace-nowrap"
                      animate={{ 
                        width: isHovered || isActive ? 'auto' : 0,
                        opacity: isHovered || isActive ? 1 : 0,
                      }}
                      transition={spring}
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Divider */}
          <div className="w-[1px] h-6 bg-border-main mx-1" />

          {/* Cart */}
          {mounted && user && <CartButton />}

          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Auth Section */}
          {!mounted || loading ? (
            <div className="px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />
            </div>
          ) : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-full hover:bg-[--color-zinc-100] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-action/10 flex items-center justify-center">
                  <User className="w-4 h-4 text-action" />
                </div>
                <span className="text-sm font-medium text-text-primary max-w-[100px] truncate">
                  {displayName}
                </span>
                <motion.div
                  animate={{ rotate: menuOpen ? 180 : 0 }}
                  transition={spring}
                >
                  <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
                </motion.div>
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setMenuOpen(false)} 
                    />
                    <motion.div 
                      className="dropdown-menu absolute right-0 top-full mt-2 w-52 border border-border-main rounded-xl shadow-xl z-50 py-1.5 overflow-hidden"
                      initial={{ opacity: 0, scale: 0.95, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -8 }}
                      transition={spring}
                    >
                      {/* User Info */}
                      <div className="px-3 py-2 border-b border-border-main mb-1">
                        <p className="text-sm font-medium text-text-primary truncate">{displayName}</p>
                        <p className="text-xs text-text-secondary truncate">{user.email}</p>
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-[--color-zinc-50] hover:translate-x-1 transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        <LayoutDashboard className="w-4 h-4 text-text-secondary" />
                        Мои курсы
                      </Link>
                      <Link
                        href="/dashboard/settings"
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-text-primary hover:bg-[--color-zinc-50] hover:translate-x-1 transition-all"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-text-secondary" />
                        Настройки
                      </Link>
                      
                      <div className="border-t border-border-main my-1" />
                      
                      <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-[--color-zinc-100] hover:translate-x-1 transition-all disabled:opacity-50"
                      >
                        {loggingOut ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                        Выйти
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium bg-action text-action-text rounded-full hover:opacity-90 transition-opacity"
            >
              Войти
            </Link>
          )}
        </nav>
      </div>

      {/* Mobile Navigation - Bottom Tab Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <nav className="nav-glass bg-[--color-bg-secondary]/95 backdrop-blur-xl border-t border-[--color-border-main] safe-area-pb">
          <ul className="flex items-center justify-around px-2 py-2">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px]',
                      isActive 
                        ? 'text-action' 
                        : 'text-text-secondary'
                    )}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                    <span className="text-[10px] font-medium">{item.label}</span>
                  </Link>
                </li>
              );
            })}
            
            {/* Cart for mobile */}
            {mounted && user && (
              <li>
                <Link
                  href="/checkout"
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px] text-text-secondary"
                >
                  <ShoppingCart size={22} strokeWidth={2} />
                  <span className="text-[10px] font-medium">Корзина</span>
                </Link>
              </li>
            )}
            
            {/* Profile / Login */}
            <li>
              {!mounted || loading ? (
                <div className="flex flex-col items-center gap-1 px-4 py-2 min-w-[64px]">
                  <Loader2 className="w-5 h-5 animate-spin text-text-secondary" />
                </div>
              ) : user ? (
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px] text-text-secondary"
                >
                  <User size={22} strokeWidth={2} />
                  <span className="text-[10px] font-medium">Профиль</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px] text-action"
                >
                  <User size={22} strokeWidth={2} />
                  <span className="text-[10px] font-medium">Войти</span>
                </Link>
              )}
            </li>
          </ul>
        </nav>
      </div>

      {/* Mobile Profile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-[60] md:hidden">
            <motion.div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-[--color-page-bg] rounded-t-2xl safe-area-pb"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={spring}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-border-main" />
              </div>
              
              {/* User Info */}
              <div className="px-5 py-4 border-b border-border-main">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-action/10 flex items-center justify-center">
                    <User className="w-6 h-6 text-action" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-text-primary truncate">{displayName}</p>
                    <p className="text-sm text-text-secondary truncate">{user?.email}</p>
                  </div>
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-[--color-zinc-100] rounded-full transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
              </div>
              
              {/* Menu Items */}
              <div className="py-2">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-4 px-5 py-4 text-text-primary hover:bg-[--color-zinc-50] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="w-5 h-5 text-text-secondary" />
                  <span className="text-base">Мои курсы</span>
                </Link>
                <Link
                  href="/dashboard/purchases"
                  className="flex items-center gap-4 px-5 py-4 text-text-primary hover:bg-[--color-zinc-50] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <ShoppingBag className="w-5 h-5 text-text-secondary" />
                  <span className="text-base">История покупок</span>
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="flex items-center gap-4 px-5 py-4 text-text-primary hover:bg-[--color-zinc-50] transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings className="w-5 h-5 text-text-secondary" />
                  <span className="text-base">Настройки</span>
                </Link>
                
                {/* Theme Switcher */}
                <div className="flex items-center gap-4 px-5 py-4 border-t border-border-main mt-2">
                  <span className="text-base text-text-primary flex-1">Тема</span>
                  <ThemeSwitcher />
                </div>
                
                {/* Logout */}
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="w-full flex items-center gap-4 px-5 py-4 text-red-500 hover:bg-[--color-zinc-100] transition-colors disabled:opacity-50 border-t border-border-main"
                >
                  {loggingOut ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                  <span className="text-base">Выйти из аккаунта</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
