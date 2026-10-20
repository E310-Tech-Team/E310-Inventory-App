"use client";

import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useCallback,
  useId,
} from "react";
import { AlertCircle, ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps {
  label?: string;
  name?: string;
  id?: string;
  value?: string | number;
  defaultValue?: string | number;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  onBlur?: (e: React.FocusEvent<HTMLElement>) => void;
  autoFocus?: boolean;
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      label,
      name,
      id,
      value: controlledValue,
      defaultValue,
      options = [],
      placeholder,
      error,
      helperText,
      leftIcon,
      disabled = false,
      required = false,
      className = "",
      triggerClassName = "",
      menuClassName = "",
      onChange,
      onBlur,
      autoFocus = false,
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || (name ? `select-${name}` : generatedId);

    // State for uncontrolled or controlled selection
    const [internalValue, setInternalValue] = useState<string>(
      controlledValue !== undefined
        ? String(controlledValue)
        : defaultValue !== undefined
        ? String(defaultValue)
        : ""
    );

    const isControlled = controlledValue !== undefined;
    const currentValue = isControlled ? String(controlledValue ?? "") : internalValue;

    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

    const containerRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const listRef = useRef<HTMLUListElement>(null);

    // Sync controlled value changes
    useEffect(() => {
      if (isControlled) {
        setInternalValue(String(controlledValue ?? ""));
      }
    }, [isControlled, controlledValue]);

    // Current selected option object
    const selectedOption = options.find((opt) => String(opt.value) === String(currentValue));

    // Handle outside clicks to close the dropdown
    useEffect(() => {
      if (!isOpen) return;

      const handleMouseDown = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleScroll = () => {
        // Optional: keep position or close on window scroll if desired
      };

      document.addEventListener("mousedown", handleMouseDown);
      window.addEventListener("scroll", handleScroll, true);

      return () => {
        document.removeEventListener("mousedown", handleMouseDown);
        window.removeEventListener("scroll", handleScroll, true);
      };
    }, [isOpen]);

    // Determine if dropdown should flip upwards based on viewport space
    const checkDropdownDirection = useCallback(() => {
      if (!triggerRef.current) return;
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const estimatedMenuHeight = Math.min(options.length * 38 + 16, 260);

      // If space below is tighter than menu height and there's more space above
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow) {
        setOpenUpward(true);
      } else {
        setOpenUpward(false);
      }
    }, [options.length]);

    const handleToggle = () => {
      if (disabled) return;
      if (!isOpen) {
        checkDropdownDirection();
        const selectedIdx = options.findIndex((opt) => String(opt.value) === String(currentValue));
        setHighlightedIndex(selectedIdx >= 0 ? selectedIdx : 0);
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    const handleSelect = (option: SelectOption) => {
      if (option.disabled || disabled) return;

      if (!isControlled) {
        setInternalValue(String(option.value));
      }

      setIsOpen(false);

      if (onChange) {
        onChange({
          target: {
            value: option.value,
            name: name,
          },
        });
      }

      // Return focus to trigger button
      triggerRef.current?.focus();
    };

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (!isOpen) {
            checkDropdownDirection();
            setIsOpen(true);
            setHighlightedIndex(0);
          } else {
            setHighlightedIndex((prev) => {
              let next = prev + 1;
              while (next < options.length && options[next]?.disabled) {
                next++;
              }
              return next < options.length ? next : prev;
            });
          }
          break;
        }

        case "ArrowUp": {
          e.preventDefault();
          if (!isOpen) {
            checkDropdownDirection();
            setIsOpen(true);
            setHighlightedIndex(options.length - 1);
          } else {
            setHighlightedIndex((prev) => {
              let next = prev - 1;
              while (next >= 0 && options[next]?.disabled) {
                next--;
              }
              return next >= 0 ? next : prev;
            });
          }
          break;
        }

        case "Enter":
        case " ": {
          e.preventDefault();
          if (isOpen && highlightedIndex >= 0 && highlightedIndex < options.length) {
            const opt = options[highlightedIndex];
            if (opt && !opt.disabled) {
              handleSelect(opt);
            }
          } else if (!isOpen) {
            handleToggle();
          }
          break;
        }

        case "Escape": {
          if (isOpen) {
            e.preventDefault();
            setIsOpen(false);
            triggerRef.current?.focus();
          }
          break;
        }

        case "Tab": {
          if (isOpen) {
            setIsOpen(false);
          }
          break;
        }

        default:
          break;
      }
    };

    // Scroll highlighted item into view
    useEffect(() => {
      if (isOpen && listRef.current && highlightedIndex >= 0) {
        const itemEl = listRef.current.children[highlightedIndex] as HTMLElement;
        if (itemEl && typeof itemEl.scrollIntoView === "function") {
          itemEl.scrollIntoView({ block: "nearest" });
        }
      }
    }, [isOpen, highlightedIndex]);

    const defaultPlaceholder =
      placeholder || (label ? `Select ${label.toLowerCase()}...` : "Select an option...");

    return (
      <div
        ref={containerRef}
        className={`w-full space-y-1.5 ${className}`}
        onKeyDown={handleKeyDown}
      >
        {/* Hidden input for HTML form submissions */}
        <input
          type="hidden"
          name={name}
          id={selectId}
          value={currentValue}
          required={required}
        />

        {label && (
          <label
            onClick={() => triggerRef.current?.focus()}
            className="block text-xs font-semibold text-foreground select-none cursor-pointer"
          >
            {label}
            {required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        <div className="relative w-full">
          {/* Custom Trigger Button */}
          <button
            ref={(node) => {
              triggerRef.current = node;
              if (typeof ref === "function") {
                ref(node);
              } else if (ref) {
                ref.current = node;
              }
            }}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={isOpen}
            aria-controls={`${selectId}-menu`}
            disabled={disabled}
            autoFocus={autoFocus}
            onClick={handleToggle}
            onBlur={onBlur}
            className={`w-full flex items-center justify-between gap-2 rounded-xl border bg-surface px-3 py-2 text-xs text-left transition-all duration-150 outline-hidden select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              error
                ? "border-rose-500/80 ring-2 ring-rose-500/20"
                : isOpen
                ? "border-brand-teal ring-2 ring-brand-teal/20 shadow-xs"
                : "border-border hover:border-brand-teal/40"
            } ${triggerClassName}`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {leftIcon && (
                <span className="shrink-0 text-muted">
                  {leftIcon}
                </span>
              )}

              {selectedOption ? (
                <div className="flex items-center gap-2 truncate">
                  {selectedOption.icon && (
                    <span className="shrink-0">{selectedOption.icon}</span>
                  )}
                  <span className="truncate font-medium text-foreground">
                    {selectedOption.label}
                  </span>
                </div>
              ) : (
                <span className="truncate text-muted">{defaultPlaceholder}</span>
              )}
            </div>

            <ChevronDown
              className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                isOpen ? "rotate-180 text-brand-teal" : "text-muted"
              }`}
            />
          </button>

          {/* Custom Themed Popover Dropdown */}
          {isOpen && (
            <div
              className={`absolute left-0 right-0 z-[100] min-w-full rounded-xl border border-border bg-surface/98 backdrop-blur-md shadow-2xl shadow-brand-navy/15 dark:shadow-black/70 animate-in fade-in zoom-in-95 duration-100 ${
                openUpward ? "bottom-full mb-1.5" : "top-full mt-1.5"
              } ${menuClassName}`}
            >
              <ul
                ref={listRef}
                id={`${selectId}-menu`}
                role="listbox"
                aria-label={label || "Options"}
                className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar focus:outline-hidden"
                tabIndex={-1}
              >
                {options.length === 0 ? (
                  <li className="px-3 py-2.5 text-xs text-muted text-center italic">
                    No options available
                  </li>
                ) : (
                  options.map((option, idx) => {
                    const isSelected = String(option.value) === String(currentValue);
                    const isHighlighted = idx === highlightedIndex;

                    return (
                      <li
                        key={option.value}
                        role="option"
                        aria-selected={isSelected}
                        aria-disabled={option.disabled}
                        onMouseEnter={() => {
                          if (!option.disabled) setHighlightedIndex(idx);
                        }}
                        onClick={() => handleSelect(option)}
                        className={`w-full px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors select-none ${
                          option.disabled
                            ? "opacity-40 cursor-not-allowed pointer-events-none text-muted"
                            : isSelected
                            ? "bg-brand-teal/15 text-brand-teal font-semibold cursor-pointer"
                            : isHighlighted
                            ? "bg-brand-teal/10 text-foreground cursor-pointer"
                            : "text-foreground hover:bg-surface-elevated cursor-pointer"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate flex-1 min-w-0">
                          {option.icon && (
                            <span className="shrink-0">{option.icon}</span>
                          )}
                          <span className="truncate">{option.label}</span>
                        </div>

                        {isSelected && (
                          <Check className="w-3.5 h-3.5 text-brand-teal shrink-0 ml-2" />
                        )}
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}
        </div>

        {error ? (
          <p className="flex items-center gap-1 text-xs text-rose-500">
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
