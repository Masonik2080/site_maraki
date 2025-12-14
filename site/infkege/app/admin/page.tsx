import { BookOpen, Users, ShoppingCart, TrendingUp } from "lucide-react";

// Заглушки для статистики (потом подключим реальные данные)
const STATS = [
  { label: "Курсов", value: "3", icon: BookOpen, change: "+1" },
  { label: "Пользователей", value: "156", icon: Users, change: "+12" },
  { label: "Заказов", value: "89", icon: ShoppingCart, change: "+5" },
  { label: "Выручка", value: "45.2K", icon: TrendingUp, change: "+8%" },
];

export default function AdminDashboard() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <header className="h-12 px-6 flex items-center border-b border-[--color-border-main]">
        <h1 className="text-sm font-semibold text-[--color-text-primary]">Дашборд</h1>
      </header>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {STATS.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 bg-[--color-action]/10 rounded-md text-[--color-action]">
                    <Icon size={16} />
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    {stat.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-[--color-text-primary] mb-0.5">
                  {stat.value}
                </div>
                <div className="text-xs text-[--color-text-secondary]">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Placeholder sections */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-4">
            <h3 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-4">
              Последние заказы
            </h3>
            <div className="text-sm text-[--color-text-secondary]/50 text-center py-8">
              Скоро здесь будет аналитика
            </div>
          </div>

          <div className="bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg p-4">
            <h3 className="text-xs font-bold text-[--color-text-secondary] uppercase tracking-wider mb-4">
              Активность
            </h3>
            <div className="text-sm text-[--color-text-secondary]/50 text-center py-8">
              Скоро здесь будет график
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
