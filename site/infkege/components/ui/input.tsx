// components/ui/input.tsx
import * as React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="
        flex h-10 w-full rounded-md px-3 py-2 text-[14px] transition-all duration-200
        
        bg-[--color-page-bg]
        border border-[--color-border-main]
        text-[--color-text-primary]
        placeholder:text-[--color-text-secondary]
        
        outline-none 
        
        focus:border-[--color-action]
        focus:ring-2 
        focus:ring-[--color-action]
        focus:ring-opacity-20
        
        disabled:cursor-not-allowed disabled:opacity-50
      "
      {...props}
    />
  );
}