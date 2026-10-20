import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-foreground"
          >
            {label}
          </label>
        )}

        <div
          className={`relative flex items-center w-full rounded-md border bg-surface transition-colors ${
            error
              ? "border-status-overdue focus-within:ring-1 focus-within:ring-status-overdue"
              : "border-border focus-within:border-accent focus-within:ring-1 focus-within:ring-accent-ring"
          }`}
        >
          {leftIcon && (
            <div className="pl-3 pr-1 text-muted select-none">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            ref={ref}
            className={`w-full bg-transparent px-3 py-2 text-xs text-foreground placeholder:text-muted focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
              leftIcon ? "pl-1.5" : ""
            } ${className}`}
            {...props}
          />

          {rightIcon && (
            <div className="pr-3 pl-1 text-muted select-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="flex items-center gap-1 text-xs text-status-overdue">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-muted">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
