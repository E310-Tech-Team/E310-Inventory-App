"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  addDays,
  parseISO,
  isValid,
  startOfDay,
  isBefore,
  isAfter,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Clock,
} from "lucide-react";
import { PresetTimerIcon } from "@/components/common/Icons";

export interface DatePickerPreset {
  label: string;
  days: number;
}

export interface DatePickerProps {
  value: string; // ISO format "YYYY-MM-DD"
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string; // "YYYY-MM-DD"
  maxDate?: string; // "YYYY-MM-DD"
  required?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  error?: string;
  helperText?: string;
  presets?: DatePickerPreset[];
  showShortcuts?: boolean;
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = "Select date...",
  minDate,
  maxDate,
  required = false,
  disabled = false,
  className = "",
  id,
  error,
  helperText,
  presets = [
    { label: "+7 Days", days: 7 },
    { label: "+14 Days", days: 14 },
    { label: "+30 Days", days: 30 },
    { label: "+60 Days", days: 60 },
  ],
  showShortcuts = true,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Selected date object
  const selectedDate = useMemo(() => {
    if (!value) return null;
    const parsed = parseISO(value);
    return isValid(parsed) ? startOfDay(parsed) : null;
  }, [value]);

  // Current view month/year
  const [viewDate, setViewDate] = useState<Date>(() => {
    if (selectedDate) return selectedDate;
    if (minDate) {
      const parsedMin = parseISO(minDate);
      if (isValid(parsedMin)) return parsedMin;
    }
    return new Date();
  });

  // When value changes from outside, sync view date if open
  useEffect(() => {
    if (selectedDate) {
      setViewDate(selectedDate);
    }
  }, [selectedDate]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Min / Max bounds
  const parsedMin = useMemo(() => {
    if (!minDate) return null;
    const p = parseISO(minDate);
    return isValid(p) ? startOfDay(p) : null;
  }, [minDate]);

  const parsedMax = useMemo(() => {
    if (!maxDate) return null;
    const p = parseISO(maxDate);
    return isValid(p) ? startOfDay(p) : null;
  }, [maxDate]);

  // Generate days for current view month
  const daysInView = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewDate]);

  const handleSelectDay = (day: Date) => {
    if (parsedMin && isBefore(day, parsedMin)) return;
    if (parsedMax && isAfter(day, parsedMax)) return;

    const formatted = format(day, "yyyy-MM-dd");
    onChange(formatted);
    setIsOpen(false);
  };

  const handleQuickAdd = (daysToAdd: number) => {
    const base = selectedDate || new Date();
    const nextDate = addDays(base, daysToAdd);
    const formatted = format(nextDate, "yyyy-MM-dd");
    onChange(formatted);
    setViewDate(nextDate);
  };

  const handleSetToday = () => {
    const today = new Date();
    onChange(format(today, "yyyy-MM-dd"));
    setViewDate(today);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  // Formatted display text
  const displayText = selectedDate
    ? format(selectedDate, "EEE, MMM d, yyyy")
    : "";

  return (
    <div ref={containerRef} className="relative w-full space-y-1.5 select-none">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-foreground flex items-center justify-between"
        >
          <span>
            {label} {required && <span className="text-rose-500">*</span>}
          </span>
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-[11px] font-normal text-muted hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </label>
      )}

      {/* Input Trigger Button */}
      <div
        id={inputId}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`group relative flex items-center justify-between w-full h-10 px-3.5 rounded-xl border bg-surface transition-all cursor-pointer ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-surface-elevated/40"
            : error
            ? "border-rose-500/80 focus:ring-2 focus:ring-rose-500/20"
            : isOpen
            ? "border-brand-teal ring-2 ring-brand-teal/20 bg-surface"
            : "border-border hover:border-brand-teal/50 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
        } ${className}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <CalendarIcon
            className={`w-4 h-4 shrink-0 transition-colors ${
              isOpen
                ? "text-brand-teal"
                : value
                ? "text-brand-teal"
                : "text-muted group-hover:text-foreground"
            }`}
          />
          <span
            className={`text-xs truncate ${
              value
                ? "font-medium text-foreground font-mono"
                : "text-muted"
            }`}
          >
            {displayText || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-muted">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-surface-elevated hover:text-foreground transition-colors"
              title="Clear date"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {helperText && !error && (
        <p className="text-[11px] text-muted">{helperText}</p>
      )}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}

      {/* ─── E310 Themed Calendar Dropdown Popover ─── */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-[310px] sm:w-[330px] rounded-2xl border border-border bg-surface p-4 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-150 text-foreground">
          {/* Calendar Header: Month, Year, and Controls */}
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h4 className="text-sm font-bold text-foreground tracking-tight">
                {format(viewDate, "MMMM yyyy")}
              </h4>
              <p className="text-[10px] text-muted font-medium">
                {selectedDate
                  ? `Selected: ${format(selectedDate, "MMM d, yyyy")}`
                  : "Pick a date"}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setViewDate((prev) => subMonths(prev, 1))}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors border border-transparent hover:border-border"
                title="Previous month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSetToday}
                className="px-2 py-1 text-[11px] font-semibold text-brand-teal hover:bg-brand-teal/10 rounded-md transition-colors"
                title="Jump to today"
              >
                Today
              </button>

              <button
                type="button"
                onClick={() => setViewDate((prev) => addMonths(prev, 1))}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-elevated transition-colors border border-transparent hover:border-border"
                title="Next month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Row (Mon - Sun) */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((dayName) => (
              <span
                key={dayName}
                className="text-[11px] font-bold text-muted uppercase tracking-wider"
              >
                {dayName}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {daysInView.map((day, idx) => {
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
              const isCurrentMonth = isSameMonth(day, viewDate);
              const isCurrentDay = isToday(day);

              const isDayDisabled =
                (parsedMin && isBefore(day, parsedMin)) ||
                (parsedMax && isAfter(day, parsedMax));

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={Boolean(isDayDisabled)}
                  onClick={() => handleSelectDay(day)}
                  className={`h-9 w-9 mx-auto rounded-xl flex flex-col items-center justify-center text-xs font-medium transition-all ${
                    isSelected
                      ? "bg-brand-teal text-white font-extrabold shadow-sm ring-2 ring-brand-teal/30 scale-105"
                      : isCurrentDay
                      ? "border border-brand-teal text-brand-teal font-bold hover:bg-brand-teal/10"
                      : isCurrentMonth
                      ? "text-foreground hover:bg-surface-elevated hover:text-foreground font-normal"
                      : "text-muted/40 hover:text-muted hover:bg-surface-elevated/40"
                  } ${
                    isDayDisabled
                      ? "opacity-25 cursor-not-allowed hover:bg-transparent"
                      : "cursor-pointer"
                  }`}
                >
                  <span>{format(day, "d")}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Shortcuts (e.g. +7, +14, +30 days) */}
          {showShortcuts && presets.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border space-y-1.5">
              <span className="text-[10px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                <PresetTimerIcon className="w-3.5 h-3.5 text-muted" />
                Quick presets
              </span>
              <div className="flex flex-wrap gap-1.5">
                {presets.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    onClick={() => handleQuickAdd(p.days)}
                    className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-surface-elevated hover:bg-brand-teal/10 hover:text-brand-teal border border-border hover:border-brand-teal/30 text-foreground transition-all"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Bar: Clear / Close */}
          <div className="mt-3 pt-2.5 flex items-center justify-between border-t border-border text-xs">
            <button
              type="button"
              onClick={handleSetToday}
              className="text-[11px] text-muted hover:text-foreground transition-colors font-medium flex items-center gap-1"
            >
              <Clock className="w-3 h-3 text-muted" />
              <span>Current date</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs font-semibold rounded-lg bg-surface-elevated hover:bg-border text-foreground transition-colors border border-border"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

