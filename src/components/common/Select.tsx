import React, { forwardRef } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      leftIcon,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-zinc-300"
          >
            {label}
          </label>
        )}

        <div
          className={`relative flex items-center w-full rounded-md border bg-zinc-900 transition-colors ${
            error
              ? "border-rose-500/80 focus-within:ring-1 focus-within:ring-rose-500"
              : "border-zinc-800 focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400"
          }`}
        >
          {leftIcon && (
            <div className="pl-3 pr-1 text-zinc-400 select-none">
              {leftIcon}
            </div>
          )}

          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-transparent px-3 py-2 text-xs text-zinc-100 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              leftIcon ? "pl-1.5" : ""
            } ${className}`}
            {...props}
          >
            <option value="" disabled className="bg-zinc-900 text-zinc-500">
              Select {label ? label.toLowerCase() : "option"}
            </option>
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-zinc-900 text-zinc-100"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pr-3 pl-1 pointer-events-none text-zinc-400">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>

        {error ? (
          <p className="flex items-center gap-1 text-xs text-rose-400">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-xs text-zinc-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = "Select";
