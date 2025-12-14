"use client";

import { cn } from "@/lib/utils";

interface FieldProps {
  label: string;
  children: React.ReactNode;
  hint?: string;
}

export function Field({ label, children, hint }: FieldProps) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-[--color-text-secondary] uppercase tracking-wider mb-1 block">
        {label}
      </label>
      {children}
      {hint && <p className="text-[10px] text-[--color-text-secondary]/60 mt-1">{hint}</p>}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mono?: boolean;
}

export function Input({ className, mono, ...props }: InputProps) {
  return (
    <input
      {...props}
      className={cn(
        "w-full h-8 px-2.5 text-sm bg-[--color-bg-secondary] border border-[--color-border-main] rounded-md",
        "text-[--color-text-primary] placeholder:text-[--color-text-secondary]/50",
        "focus:border-[--color-action] focus:ring-1 focus:ring-[--color-action]/20 outline-none transition-all",
        mono && "font-mono",
        className
      )}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  mono?: boolean;
  dark?: boolean;
}

export function Textarea({ className, mono, dark, ...props }: TextareaProps) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full px-2.5 py-2 text-sm border rounded-md outline-none transition-all resize-y",
        dark
          ? "bg-[#1e1e1e] border-[--color-border-main] text-zinc-100 placeholder:text-zinc-500"
          : "bg-[--color-bg-secondary] border-[--color-border-main] text-[--color-text-primary] placeholder:text-[--color-text-secondary]/50",
        "focus:border-[--color-action] focus:ring-1 focus:ring-[--color-action]/20",
        mono && "font-mono",
        className
      )}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
}

export function Select({ options, className, ...props }: SelectProps) {
  return (
    <select
      {...props}
      className={cn(
        "h-8 px-2.5 text-sm bg-[--color-bg-secondary] border border-[--color-border-main] rounded-md",
        "text-[--color-text-primary] focus:border-[--color-action] outline-none transition-all",
        className
      )}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
