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

          <select
            id={selectId}
            ref={ref}
            className={`w-full appearance-none bg-transparent px-3 py-2 text-xs text-foreground focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              leftIcon ? "pl-1.5" : ""
            } ${className}`}
            {...props}
          >
            <option value="" disabled className="bg-surface text-muted">
              Select {label ? label.toLowerCase() : "option"}
            </option>
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
                className="bg-surface text-foreground"
              >
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pr-3 pl-1 pointer-events-none text-muted">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
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

Select.displayName = "Select";
