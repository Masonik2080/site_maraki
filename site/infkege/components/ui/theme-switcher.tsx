// components/ui/theme-switcher.tsx
"use client";

import React from "react";
import { Sun, Moon, Laptop } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const options = [
    { name: "light", icon: Sun },
    { name: "dark", icon: Moon },
    { name: "system", icon: Laptop },
  ] as const;

  // Предотвращаем hydration mismatch
  if (!mounted) {
    return (
      <div className="flex items-center gap-1 p-1 bg-bg-secondary border border-border-main rounded-full">
        <div className="p-1.5 w-8 h-8" />
        <div className="p-1.5 w-8 h-8" />
        <div className="p-1.5 w-8 h-8" />
      </div>
    );
  }

  return (
    <div data-theme-switcher className="flex items-center gap-1 p-1 bg-bg-secondary border border-border-main rounded-full">
      {options.map((opt) => {
        const isActive = theme === opt.name;
        const Icon = opt.icon;
        return (
          <button
            key={opt.name}
            onClick={() => setTheme(opt.name)}
            className={cn(
              "p-1.5 rounded-full transition-colors relative",
              isActive ? "text-action" : "text-text-secondary hover:text-text-primary"
            )}
            title={`Set theme to ${opt.name}`}
          >
            {isActive && (
              <span
                className="absolute inset-0 bg-action/10 rounded-full"
              />
            )}
            <Icon size={16} className="relative z-10" />
          </button>
        );
      })}
    </div>
  );
}