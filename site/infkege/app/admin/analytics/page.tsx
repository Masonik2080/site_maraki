import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <header className="h-12 px-6 flex items-center border-b border-[--color-border-main]">
        <h1 className="text-sm font-semibold text-[--color-text-primary]">Аналитика</h1>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <BarChart3 size={48} className="mx-auto mb-4 text-[--color-text-secondary]/30" />
          <h2 className="text-lg font-semibold text-[--color-text-primary] mb-2">
            Скоро здесь будет аналитика
          </h2>
          <p className="text-sm text-[--color-text-secondary] max-w-md">
            Графики продаж, активности пользователей, популярные курсы и другие метрики
          </p>
        </div>
      </div>
    </div>
  );
}
