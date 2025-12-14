// components/theme-provider.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeProviderState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("theme") as Theme) || "system";
    }
    return "system";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      const currentTheme = theme === "system" ? systemTheme : theme;
      root.setAttribute("data-theme", currentTheme);
    };

    applyTheme();
    localStorage.setItem("theme", theme);

    // Слушаем изменения системной темы, если выбрана "system"
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const value = { theme, setTheme };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};