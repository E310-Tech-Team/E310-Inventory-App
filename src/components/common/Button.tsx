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
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5 h-8",
    md: "text-xs px-3.5 py-2 gap-2 h-9",
    lg: "text-sm px-4 py-2.5 gap-2 h-10",
  };

  const variantStyles = {
    primary:
      "bg-zinc-100 hover:bg-white text-zinc-950 font-medium shadow-sm",
    secondary:
      "bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/70",
    outline:
      "bg-transparent hover:bg-zinc-800/60 text-zinc-300 border border-zinc-800 hover:border-zinc-700",
    ghost:
      "bg-transparent hover:bg-zinc-800/60 text-zinc-400 hover:text-zinc-200",
    destructive:
      "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20",
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
