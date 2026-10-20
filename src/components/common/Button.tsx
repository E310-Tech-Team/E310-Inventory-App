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
    "inline-flex items-center justify-center font-medium rounded-lg transition-colors select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-ring focus:ring-offset-2 focus:ring-offset-background";

  const sizeStyles = {
    sm: "text-xs px-2.5 py-1.5 gap-1.5 h-8",
    md: "text-xs px-3.5 py-2 gap-2 h-9",
    lg: "text-sm px-4 py-2.5 gap-2 h-10",
  };

  const variantStyles = {
    primary:
      "bg-foreground text-background hover:bg-foreground/90 font-medium shadow-xs",
    secondary:
      "bg-surface-subtle hover:bg-surface text-foreground border border-border shadow-xs",
    outline:
      "bg-transparent hover:bg-surface-subtle text-foreground border border-border",
    ghost:
      "bg-transparent hover:bg-surface-subtle text-muted hover:text-foreground",
    destructive:
      "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/20",
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
