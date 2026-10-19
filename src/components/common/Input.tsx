import React, { forwardRef, useState } from "react";
import { AlertCircle } from "lucide-react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
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
      value,
      defaultValue,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const hasValue = Boolean(value || defaultValue);

    const isFloating = isFocused || hasValue;

    return (
      <div className="relative w-full">
        <div
          className={`relative flex items-center w-full rounded-xl border bg-neutral-900/60 transition-all duration-200 ${
            error
              ? "border-rose-500/80 focus-within:ring-2 focus-within:ring-rose-500/30"
              : isFocused
              ? "border-emerald-500/80 ring-2 ring-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]"
              : "border-neutral-700/70 hover:border-neutral-600"
          }`}
        >
          {leftIcon && (
            <div className="pl-3.5 pr-1 text-neutral-400 select-none">
              {leftIcon}
            </div>
          )}

          <div className="relative flex-1">
            <input
              ref={ref}
              value={value}
              defaultValue={defaultValue}
              onFocus={(e) => {
                setIsFocused(true);
                onFocus?.(e);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur?.(e);
              }}
              className={`w-full bg-transparent px-3.5 pt-5 pb-1.5 text-sm text-white placeholder-transparent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                leftIcon ? "pl-1" : ""
              } ${className}`}
              placeholder={label}
              {...props}
            />

            <label
              className={`pointer-events-none absolute left-3.5 transition-all duration-150 origin-top-left ${
                leftIcon ? "left-1" : ""
              } ${
                isFloating
                  ? "top-1 text-[10px] uppercase font-mono tracking-wider font-semibold text-neutral-400"
                  : "top-3.5 text-sm text-neutral-400"
              } ${error ? "text-rose-400" : isFocused ? "text-emerald-400" : ""}`}
            >
              {label}
            </label>
          </div>

          {rightIcon && (
            <div className="pr-3.5 pl-1 text-neutral-400 select-none">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-rose-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-neutral-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
