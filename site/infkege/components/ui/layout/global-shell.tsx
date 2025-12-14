"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { FloatingNav } from "@/components/ui/layout/floating-nav";
import { Footer } from "@/components/ui/layout/footer";
import { WelcomeTour } from "@/components/ui/welcome-tour";

export function GlobalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Проверяем, находимся ли мы внутри раздела обучения
  // Если путь начинается с "/learn", считаем это режимом приложения (LMS)
  const isLearnMode = pathname?.startsWith("/learn");
  const isAdminMode = pathname?.startsWith("/admin");

  if (isLearnMode || isAdminMode) {
    // В режиме обучения/админки возвращаем чистый контент
    return <>{children}</>;
  }

  // В обычном режиме (Главная, Личный кабинет и т.д.)
  return (
    <>
      <FloatingNav />
      <WelcomeTour />
      <div className="flex min-h-screen flex-col pt-4 md:pt-24">
        <main className="flex-1 w-full">
          {children}
        </main>
        <Footer />
      </div>
    </>
  );
}