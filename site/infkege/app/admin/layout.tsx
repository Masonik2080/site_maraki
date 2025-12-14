"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  BarChart3,
  Users,
  Menu,
  X,
  Link2,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Курсы", icon: BookOpen },
  { href: "/admin/payment-links", label: "Ссылки оплаты", icon: Link2 },
  { href: "/admin/recovery", label: "Восстановления", icon: RotateCcw },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/admin/users", label: "Пользователи", icon: Users },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[--color-page-bg] flex">
      {/* Mobile Header */}
      <div 
        className="lg:hidden fixed top-0 left-0 right-0 h-12 border-b flex items-center justify-between px-4 z-40"
        style={{ backgroundColor: "#f4f4f5", borderColor: "#e5e7eb" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: "#1a1a2e" }}>INFKEGE</span>
          <span 
            className="text-[10px] font-medium px-1.5 py-0.5 rounded"
            style={{ color: "#1a1a2e", backgroundColor: "rgba(26,26,46,0.1)" }}
          >
            admin
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2"
          style={{ color: "#6b7280" }}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 modal-backdrop"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed top-12 left-0 bottom-0 w-64 border-r z-50 transform transition-transform duration-200",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: "#f4f4f5", borderColor: "#e5e7eb" }}
      >
        <nav className="p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={closeMobileMenu}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-md transition-all"
                    style={{
                      color: isActive ? "#1a1a2e" : "#6b7280",
                      backgroundColor: isActive ? "rgba(26,26,46,0.1)" : "transparent",
                    }}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div 
          className="absolute bottom-0 left-0 right-0 p-3 border-t"
          style={{ borderColor: "#e5e7eb" }}
        >
          <Link
            href="/"
            onClick={closeMobileMenu}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-all"
            style={{ color: "#6b7280" }}
          >
            ← На сайт
          </Link>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-52 border-r border-[--color-border-main] bg-[--color-bg-secondary] flex-col">
        {/* Logo */}
        <div className="h-12 px-4 flex items-center border-b border-[--color-border-main]">
          <span className="text-sm font-bold text-[--color-text-primary]">INFKEGE</span>
          <span className="ml-2 text-[10px] font-medium text-[--color-action] bg-[--color-action]/10 px-1.5 py-0.5 rounded">
            admin
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname?.startsWith(item.href));
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-md transition-all",
                      isActive
                        ? "bg-[--color-action]/10 text-[--color-action]"
                        : "text-[--color-text-secondary] hover:text-[--color-text-primary] hover:bg-[--color-page-bg]"
                    )}
                  >
                    <Icon size={15} />
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-[--color-border-main]">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-xs text-[--color-text-secondary] hover:text-[--color-text-primary] rounded-md hover:bg-[--color-page-bg] transition-all"
          >
            ← На сайт
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 pt-12 lg:pt-0">{children}</main>
    </div>
  );
}
