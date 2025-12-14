// components/ui/card.tsx
import * as React from "react";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-[--color-bg-secondary] border border-[--color-border-main] rounded-lg overflow-hidden shadow-sm ${className || ""}`}>
      {children}
    </div>
  );
}