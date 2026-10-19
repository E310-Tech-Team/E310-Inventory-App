import React from "react";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none pressable disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-neutral-950";

  const sizeStyles = {
    sm: "text-xs px-3 py-1.5 gap-1.5 h-8",
    md: "text-sm px-4 py-2 gap-2 h-10",
    lg: "text-base px-5 py-2.5 gap-2.5 h-12",
  };

  const variantStyles = {
    primary:
      "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-semibold shadow-[0_4px_16px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgba(16,185,129,0.45)] border border-emerald-400/40",
    secondary:
      "bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-100 border border-neutral-700/70 backdrop-blur-md shadow-sm",
    outline:
      "bg-transparent hover:bg-neutral-800/50 text-neutral-200 border border-neutral-700 hover:border-neutral-500",
    ghost:
      "bg-transparent hover:bg-neutral-800/60 text-neutral-300 hover:text-white",
    destructive:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
