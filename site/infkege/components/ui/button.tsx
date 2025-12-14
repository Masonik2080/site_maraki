// components/ui/button.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "default", asChild = false, ...props }, ref) => {
    // Если asChild=true, используем Slot (рендерит ребенка с нашими стилями)
    // Если false, рендерим обычную кнопку
    const Comp = asChild ? Slot : "button";
    
    const baseStyles = 
      "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 " +
      "outline-none " +
      "focus-visible:outline-none " +
      "disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]";
    
    const variants = {
      primary: "bg-[--color-action] text-[--color-action-text] hover:bg-[--color-action-hover] shadow-sm border border-transparent",
      outline: "border border-[--color-border-main] bg-[--color-page-bg] hover:bg-[--color-bg-secondary] text-[--color-text-primary] shadow-sm",
      ghost: "hover:bg-[--color-bg-secondary] text-[--color-text-secondary] hover:text-[--color-text-primary] border border-transparent",
    };

    const sizes = {
      default: "px-4 py-2 text-[14px]",
      sm: "px-3 py-1.5 text-[13px]",
      lg: "px-6 py-3 text-[15px]",
      icon: "h-9 w-9 p-0",
    };

    // Склеиваем классы
    const finalClass = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ""}`;

    return (
      <Comp
        className={finalClass}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";