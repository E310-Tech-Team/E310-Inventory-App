"use client";

import React, { useState, useRef, useEffect, useMemo, useId } from "react";
import { createPortal } from "react-dom";
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
  addYears,
  subYears,
  addDays,
  parseISO,
  isValid,
  startOfDay,
  isBefore,
  isAfter,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  CalendarClock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
} from "lucide-react";
import { PresetTimerIcon } from "@/components/common/Icons";

export interface DatePickerPreset {
  label: string;
  days: number;
}

export interface DatePickerProps {
  value: string; // "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" when includeTime is true
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  error?: string;
  helperText?: string;
  presets?: DatePickerPreset[];
  showShortcuts?: boolean;
  includeTime?: boolean;
  defaultTime?: string; // "HH:mm" used when choosing a date while empty in includeTime mode
}

interface PopoverPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"] as const;
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr",
  "May", "Jun", "Jul", "Aug",
  "Sep", "Oct", "Nov", "Dec",
] as const;
const HOURS = Array.from({ length: 24 }, (_, idx) => idx);
const MINUTES = Array.from({ length: 60 }, (_, idx) => idx);

function pad2(num: number): string {
  return String(num).padStart(2, "0");
}

function parsePickerDay(raw?: string): Date | null {
  if (!raw) return null;
  const parsed = parseISO(raw);
  return isValid(parsed) ? startOfDay(parsed) : null;
}

function parseTimeParts(
  raw?: string,
  defaultTime?: string
): { hours: number; minutes: number } {
  if (raw) {
    const parsed = parseISO(raw);
    if (isValid(parsed) && raw.includes("T")) {
      return { hours: parsed.getHours(), minutes: parsed.getMinutes() };
    }
  }
  if (defaultTime) {
    const match = defaultTime.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      return {
        hours: Math.min(23, Math.max(0, Number(match[1]))),
        minutes: Math.min(59, Math.max(0, Number(match[2]))),
      };
    }
  }
  const now = new Date();
  return { hours: now.getHours(), minutes: now.getMinutes() };
}

function formatPickerOutput(
  day: Date,
  hours: number,
  minutes: number,
  includeTime: boolean
): string {
  const datePart = format(day, "yyyy-MM-dd");
  return includeTime ? `${datePart}T${pad2(hours)}:${pad2(minutes)}` : datePart;
}

function computePopoverPosition(
  triggerEl: HTMLElement,
  includeTime: boolean,
  hasShortcuts: boolean
): PopoverPosition {
  const rect = triggerEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const isWide = vw >= 640;

  const desiredWidth = includeTime && isWide ? 436 : 308;
  const width = Math.min(desiredWidth, vw - 24);
  const left = Math.max(12, Math.min(rect.left, vw - width - 12));

  const estimatedHeight = includeTime
    ? isWide
      ? 365
      : 470
    : hasShortcuts
    ? 410
    : 345;

  const spaceBelow = vh - rect.bottom - 12;
  const spaceAbove = rect.top - 12;

  if (spaceBelow >= estimatedHeight || spaceBelow >= spaceAbove) {
    return {
      top: rect.bottom + 8,
      left,
      width,
      maxHeight: Math.max(220, spaceBelow),
    };
  }

  return {
    bottom: vh - rect.top + 8,
    left,
    width,
    maxHeight: Math.max(220, spaceAbove),
  };
}

function scrollButtonIntoCenter(container: HTMLDivElement | null, index: number) {
  if (!container) return;
  const target = container.children[index] as HTMLElement | undefined;
  if (!target) return;
  container.scrollTop = Math.max(
    0,
    target.offsetTop - container.clientHeight / 2 + target.offsetHeight / 2
  );
}

/**
 * E310-themed Date and Date-Time Picker popover rendered in a portal so it stays
 * unclipped inside cards/modals and adapts cleanly to mobile viewports.
 */
export function DatePicker({
  value,
  onChange,
  label,
  placeholder,
  minDate,
  maxDate,
  required = false,
  disabled = false,
  className = "",
  triggerClassName = "",
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
  includeTime = false,
  defaultTime,
}: DatePickerProps) {
  const generatedId = useId();
  const inputId = id || (label ? `date-${label.toLowerCase().replace(/\s+/g, "-")}-${generatedId}` : generatedId);

  const [isOpen, setIsOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<"days" | "months">("days");
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const hourListRef = useRef<HTMLDivElement>(null);
  const minuteListRef = useRef<HTMLDivElement>(null);

  const selectedDate = useMemo(() => parsePickerDay(value), [value]);
  const parsedMin = useMemo(() => parsePickerDay(minDate), [minDate]);
  const parsedMax = useMemo(() => parsePickerDay(maxDate), [maxDate]);
  const { hours: currentHours, minutes: currentMinutes } = useMemo(
    () => parseTimeParts(value, defaultTime),
    [value, defaultTime]
  );

  const [viewDate, setViewDate] = useState<Date>(
    () => selectedDate || parsedMin || new Date()
  );

  const effectiveShowShortcuts = !includeTime && showShortcuts && presets.length > 0;

  // Keep portal position synced and dismiss on outside click / Escape
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const inContainer = containerRef.current?.contains(target);
      const inPopover = popoverRef.current?.contains(target);
      if (!inContainer && !inPopover) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.stopPropagation();
        event.stopImmediatePropagation();
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    function handleReposition(event: Event) {
      if (event.type === "scroll" && popoverRef.current?.contains(event.target as Node)) {
        return;
      }
      if (triggerRef.current) {
        setPopoverPos(
          computePopoverPosition(triggerRef.current, includeTime, effectiveShowShortcuts)
        );
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [isOpen, includeTime, effectiveShowShortcuts]);

  const daysInView = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [viewDate]);

  const clampDay = (day: Date): Date => {
    const d = startOfDay(day);
    if (parsedMin && isBefore(d, parsedMin)) return parsedMin;
    if (parsedMax && isAfter(d, parsedMax)) return parsedMax;
    return d;
  };

  const isDayOutOfRange = (day: Date): boolean => {
    if (parsedMin && isBefore(day, parsedMin)) return true;
    if (parsedMax && isAfter(day, parsedMax)) return true;
    return false;
  };

  const openPopover = () => {
    if (disabled) return;
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setPanelMode("days");
    setViewDate(selectedDate || parsedMin || new Date());

    if (triggerRef.current) {
      setPopoverPos(
        computePopoverPosition(triggerRef.current, includeTime, effectiveShowShortcuts)
      );
    }

    setIsOpen(true);

    if (includeTime) {
      requestAnimationFrame(() => {
        scrollButtonIntoCenter(hourListRef.current, currentHours);
        scrollButtonIntoCenter(minuteListRef.current, currentMinutes);
      });
    }
  };

  const handleSelectDay = (day: Date) => {
    if (isDayOutOfRange(day)) return;
    onChange(formatPickerOutput(day, currentHours, currentMinutes, includeTime));
    setViewDate(day);
    if (!includeTime) {
      setIsOpen(false);
    }
  };

  const handleTimeChange = (nextHours: number, nextMinutes: number) => {
    const baseDay = selectedDate || clampDay(new Date());
    setViewDate(baseDay);
    onChange(formatPickerOutput(baseDay, nextHours, nextMinutes, true));
  };

  const handleQuickAdd = (daysToAdd: number) => {
    const base = selectedDate || new Date();
    const nextDate = clampDay(addDays(base, daysToAdd));
    onChange(formatPickerOutput(nextDate, currentHours, currentMinutes, includeTime));
    setViewDate(nextDate);
  };

  const handleSetTodayOrNow = () => {
    const now = new Date();
    const targetDay = clampDay(now);
    const hrs = includeTime ? now.getHours() : currentHours;
    const mins = includeTime ? now.getMinutes() : currentMinutes;
    onChange(formatPickerOutput(targetDay, hrs, mins, includeTime));
    setViewDate(targetDay);
    if (includeTime) {
      requestAnimationFrame(() => {
        scrollButtonIntoCenter(hourListRef.current, hrs);
        scrollButtonIntoCenter(minuteListRef.current, mins);
      });
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange("");
  };

  const resolvedPlaceholder =
    placeholder || (includeTime ? "Select date & time..." : "Select date...");

  const displayText = useMemo(() => {
    if (!value) return "";
    const parsed = parseISO(value);
    if (!isValid(parsed)) return "";
    return includeTime
      ? format(parsed, "MMM d, yyyy · HH:mm")
      : format(parsed, "EEE, MMM d, yyyy");
  }, [value, includeTime]);

  const Icon = includeTime ? CalendarClock : CalendarIcon;
  const activeTimeLabel = `${pad2(currentHours)}:${pad2(currentMinutes)}`;

  const popoverContent =
    isOpen && popoverPos && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label={label || (includeTime ? "Choose date and time" : "Choose date")}
            style={{
              top: popoverPos.top,
              bottom: popoverPos.bottom,
              left: popoverPos.left,
              width: popoverPos.width,
              maxHeight: popoverPos.maxHeight,
            }}
            className="fixed z-[120] rounded-2xl border border-border/80 bg-surface p-3.5 sm:p-4 shadow-2xl shadow-brand-navy/15 dark:shadow-black/70 text-foreground modal-panel overflow-y-auto overscroll-contain"
          >
            <div className="flex flex-col sm:flex-row">
              {/* Calendar Column */}
              <div className="flex-1 min-w-0">
                {/* Header: Interactive Month/Year switcher + steppers */}
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
                  <button
                    type="button"
                    onClick={() =>
                      setPanelMode((prev) => (prev === "days" ? "months" : "days"))
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 -ml-1 text-sm font-semibold tracking-tight text-foreground hover:bg-surface-elevated hover:text-brand-teal transition-colors"
                  >
                    <span>
                      {panelMode === "months"
                        ? format(viewDate, "yyyy")
                        : format(viewDate, "MMMM yyyy")}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted transition-transform duration-150 ${
                        panelMode === "months" ? "rotate-180 text-brand-teal" : ""
                      }`}
                    />
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        setViewDate((prev) =>
                          panelMode === "months" ? subYears(prev, 1) : subMonths(prev, 1)
                        )
                      }
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/70 bg-surface-elevated/40 text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                      title={panelMode === "months" ? "Previous year" : "Previous month"}
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setViewDate((prev) =>
                          panelMode === "months" ? addYears(prev, 1) : addMonths(prev, 1)
                        )
                      }
                      className="h-7 w-7 inline-flex items-center justify-center rounded-lg border border-border/70 bg-surface-elevated/40 text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
                      title={panelMode === "months" ? "Next year" : "Next month"}
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {panelMode === "months" ? (
                  <div className="grid grid-cols-3 gap-1.5 pt-3 pb-1">
                    {MONTHS.map((monthName, monthIdx) => {
                      const isActiveMonth = viewDate.getMonth() === monthIdx;
                      const now = new Date();
                      const isCurrentRealMonth =
                        now.getFullYear() === viewDate.getFullYear() &&
                        now.getMonth() === monthIdx;

                      return (
                        <button
                          key={monthName}
                          type="button"
                          onClick={() => {
                            setViewDate(new Date(viewDate.getFullYear(), monthIdx, 1));
                            setPanelMode("days");
                          }}
                          className={`h-9 rounded-xl text-xs font-medium transition-all ${
                            isActiveMonth
                              ? "bg-accent text-white font-semibold shadow-2xs"
                              : isCurrentRealMonth
                              ? "border border-brand-teal/60 bg-brand-teal/10 text-brand-teal font-semibold hover:bg-brand-teal/15"
                              : "text-foreground hover:bg-surface-elevated"
                          }`}
                        >
                          {monthName}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 gap-1 pt-2.5 pb-1 text-center">
                      {WEEKDAYS.map((dayName) => (
                        <span
                          key={dayName}
                          className="text-[11px] font-semibold text-muted/80 uppercase tracking-wider"
                        >
                          {dayName}
                        </span>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 pt-0.5">
                      {daysInView.map((day) => {
                        const isSelected = selectedDate
                          ? isSameDay(day, selectedDate)
                          : false;
                        const isCurrentMonth = isSameMonth(day, viewDate);
                        const isCurrentDay = isToday(day);
                        const isDayDisabled = isDayOutOfRange(day);

                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            disabled={isDayDisabled}
                            onClick={() => handleSelectDay(day)}
                            className={`h-8 w-8 sm:h-9 sm:w-9 mx-auto rounded-xl flex items-center justify-center text-xs tabular-nums transition-all ${
                              isSelected
                                ? "bg-accent text-white font-semibold shadow-xs ring-2 ring-accent/25"
                                : isCurrentDay
                                ? "border border-brand-teal/60 bg-brand-teal/10 text-brand-teal font-semibold hover:bg-brand-teal/15"
                                : isCurrentMonth
                                ? "text-foreground hover:bg-surface-elevated font-normal"
                                : "text-muted/40 hover:text-muted hover:bg-surface-elevated/40"
                            } ${
                              isDayDisabled
                                ? "opacity-25 cursor-not-allowed hover:bg-transparent"
                                : "cursor-pointer"
                            }`}
                          >
                            {format(day, "d")}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Quick Presets (Date mode) */}
                {effectiveShowShortcuts && panelMode === "days" && (
                  <div className="mt-3 pt-2.5 border-t border-border/60 space-y-1.5">
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
                          className="px-2.5 py-1 text-[11px] font-medium rounded-lg bg-surface-elevated/70 hover:bg-accent/10 hover:text-brand-teal border border-border/70 hover:border-brand-teal/40 text-foreground transition-colors"
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Integrated E310 Time Panel (when includeTime is true) */}
              {includeTime && (
                <div className="mt-3 pt-3 border-t border-border/60 sm:mt-0 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-3.5 sm:ml-3.5 sm:w-[126px] shrink-0 flex flex-col">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                      <Clock className="w-3 h-3 text-brand-teal" />
                      Time
                    </span>
                    <span className="text-[11px] font-mono font-semibold text-brand-teal bg-brand-teal/10 border border-brand-teal/20 px-1.5 py-0.5 rounded-md tabular-nums">
                      {activeTimeLabel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 pt-2 pb-1 text-center">
                    <span className="text-[10px] font-semibold text-muted/80 uppercase tracking-wider">
                      Hr
                    </span>
                    <span className="text-[10px] font-semibold text-muted/80 uppercase tracking-wider">
                      Min
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <div
                      ref={hourListRef}
                      className="h-28 sm:h-[208px] overflow-y-auto space-y-0.5 pr-0.5 rounded-xl bg-surface-elevated/35 p-1 border border-border/50"
                    >
                      {HOURS.map((hr) => {
                        const isSelectedHr = hr === currentHours && Boolean(value);
                        return (
                          <button
                            key={hr}
                            type="button"
                            onClick={() => handleTimeChange(hr, currentMinutes)}
                            className={`w-full h-7 rounded-lg text-xs font-mono tabular-nums flex items-center justify-center transition-colors ${
                              isSelectedHr
                                ? "bg-accent text-white font-semibold shadow-2xs"
                                : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
                            }`}
                          >
                            {pad2(hr)}
                          </button>
                        );
                      })}
                    </div>

                    <div
                      ref={minuteListRef}
                      className="h-28 sm:h-[208px] overflow-y-auto space-y-0.5 pr-0.5 rounded-xl bg-surface-elevated/35 p-1 border border-border/50"
                    >
                      {MINUTES.map((min) => {
                        const isSelectedMin = min === currentMinutes && Boolean(value);
                        return (
                          <button
                            key={min}
                            type="button"
                            onClick={() => handleTimeChange(currentHours, min)}
                            className={`w-full h-7 rounded-lg text-xs font-mono tabular-nums flex items-center justify-center transition-colors ${
                              isSelectedMin
                                ? "bg-accent text-white font-semibold shadow-2xs"
                                : "text-foreground-muted hover:bg-surface-elevated hover:text-foreground"
                            }`}
                          >
                            {pad2(min)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="mt-3 pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                {value && !disabled && (
                  <button
                    type="button"
                    onClick={() => handleClear()}
                    className="text-[11px] font-medium text-muted hover:text-rose-500 transition-colors"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleSetTodayOrNow}
                  className="text-[11px] font-semibold text-brand-teal hover:underline transition-colors"
                >
                  {includeTime ? "Now" : "Today"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 text-[11px] font-semibold rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div ref={containerRef} className={`relative w-full space-y-1.5 select-none ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="flex items-center justify-between text-xs font-semibold text-foreground cursor-pointer"
        >
          <span>
            {label} {required && <span className="ml-0.5 text-rose-500">*</span>}
          </span>
        </label>
      )}

      {/* Hidden value for native HTML form validation if required */}
      {required && (
        <input
          tabIndex={-1}
          aria-hidden="true"
          value={value}
          onChange={() => {}}
          required
          className="sr-only"
        />
      )}

      <div className="relative w-full">
        <button
          ref={triggerRef}
          id={inputId}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={isOpen}
          onClick={openPopover}
          className={`group w-full min-h-[38px] flex items-center justify-between gap-2 rounded-xl border bg-surface px-3 py-2 text-xs text-left transition-all duration-150 outline-hidden ${
            value && !disabled ? "pr-14" : "pr-8"
          } ${
            disabled
              ? "opacity-50 cursor-not-allowed bg-surface-elevated/40"
              : error
              ? "border-rose-500/80 ring-2 ring-rose-500/20 cursor-pointer"
              : isOpen
              ? "border-brand-teal ring-2 ring-brand-teal/20 shadow-xs cursor-pointer"
              : "border-border hover:border-brand-teal/40 focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 cursor-pointer"
          } ${triggerClassName}`}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1">
            <Icon
              className={`w-4 h-4 shrink-0 transition-colors ${
                isOpen || value
                  ? "text-brand-teal"
                  : "text-muted group-hover:text-foreground"
              }`}
            />
            <span
              className={`truncate ${
                displayText
                  ? "font-medium text-foreground tabular-nums"
                  : "text-muted"
              }`}
            >
              {displayText || resolvedPlaceholder}
            </span>
          </span>
        </button>

        {/* Right Controls (kept as siblings to avoid nested interactive elements) */}
        <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear date"
              title="Clear date"
              className="pointer-events-auto p-1 rounded-md text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted transition-transform duration-200 ${
              isOpen ? "rotate-180 text-brand-teal" : ""
            }`}
          />
        </div>
      </div>

      {helperText && !error && (
        <p className="text-[11px] text-muted">{helperText}</p>
      )}
      {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}

      {popoverContent}
    </div>
  );
}
