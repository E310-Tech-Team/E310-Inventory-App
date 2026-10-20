"use client";

import { useEffect, useState, useRef, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Laptop,
  AlertCircle,
  Users,
  CornerDownLeft,
  X,
  Package,
  Sliders,
  CheckCircle2,
  Loader2,
  FileText,
} from "lucide-react";
import { SearchResponse, SearchResultItem } from "@/app/api/search/route";

interface QuickAction {
  id: string;
  category: "quick-actions";
  title: string;
  subtitle: string;
  icon: typeof Laptop;
  url: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    id: "action-my-devices",
    category: "quick-actions",
    title: "My Assigned Equipment",
    subtitle: "View devices currently checked out in your custody",
    icon: Laptop,
    url: "/staff",
  },
  {
    id: "action-report-issue",
    category: "quick-actions",
    title: "Report Hardware Fault / Complaint",
    subtitle: "Submit a new repair or replacement ticket",
    icon: AlertCircle,
    url: "/staff",
  },
  {
    id: "action-inventory",
    category: "quick-actions",
    title: "Master Asset Catalog",
    subtitle: "Search, filter, and inspect departmental hardware",
    icon: Package,
    url: "/tech/items",
  },
  {
    id: "action-approvals",
    category: "quick-actions",
    title: "Device Self-Registration Queue",
    subtitle: "Review pending staff hardware registrations",
    icon: CheckCircle2,
    url: "/tech/approvals",
  },
  {
    id: "action-options",
    category: "quick-actions",
    title: "Portal Configuration Options",
    subtitle: "Manage device categories, brands, and ticket types",
    icon: Sliders,
    url: "/tech/options",
  },
];

interface CommandSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: string;
}

export function CommandSearchModal({
  isOpen,
  onClose,
}: CommandSearchModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse["results"]>({
    devices: [],
    tickets: [],
    staff: [],
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [, startTransition] = useTransition();

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    setQuery("");
    setResults({ devices: [], tickets: [], staff: [] });
    setSelectedIndex(0);
    onClose();
  }, [onClose]);

  // Flatten currently visible items for single-index keyboard navigation
  const flattenedItems = useMemo<Array<SearchResultItem | QuickAction>>(() => {
    if (query.trim().length === 0) {
      return QUICK_ACTIONS;
    }
    return [
      ...results.devices,
      ...results.tickets,
      ...results.staff,
    ];
  }, [query, results]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  function handleQueryChange(val: string) {
    setQuery(val);
    if (!val.trim()) {
      setResults({ devices: [], tickets: [], staff: [] });
      setIsLoading(false);
      setSelectedIndex(0);
    } else {
      setIsLoading(true);
    }
  }

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    const controller = new AbortController();

    const handler = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data: SearchResponse = await res.json();
          setResults(data.results);
          setSelectedIndex(0);
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== "AbortError") {
          console.error("Search fetch failed:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => {
      clearTimeout(handler);
      controller.abort();
    };
  }, [query]);

  // Navigate to target
  const handleSelect = useCallback(
    (item: SearchResultItem | QuickAction) => {
      handleClose();
      startTransition(() => {
        router.push(item.url);
      });
    },
    [handleClose, router]
  );

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
        return;
      }

      if (flattenedItems.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % flattenedItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev - 1 < 0 ? flattenedItems.length - 1 : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        const activeItem = flattenedItems[selectedIndex];
        if (activeItem) {
          handleSelect(activeItem);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, flattenedItems, selectedIndex, handleClose, handleSelect]);

  // Ensure active keyboard item is scrolled into view
  useEffect(() => {
    if (resultsRef.current) {
      const activeElement = resultsRef.current.querySelector(
        `[data-item-index="${selectedIndex}"]`
      );
      if (activeElement) {
        activeElement.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-search-title"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="w-full max-w-2xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] transition-all scale-100 animate-in zoom-in-95 duration-150">
        {/* Header / Input Field */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-border bg-surface">
          <Search className="w-5 h-5 text-muted shrink-0 mr-3" />
          <input
            id="command-search-title"
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search devices, tickets, staff members..."
            className="w-full bg-transparent text-foreground placeholder:text-muted text-base focus:outline-hidden"
          />
          {isLoading && (
            <Loader2 className="w-4 h-4 text-muted animate-spin shrink-0 mr-2" />
          )}
          {query.length > 0 && !isLoading && (
            <button
              onClick={() => handleQueryChange("")}
              className="p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated transition-colors mr-2"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={handleClose}
            className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-semibold tracking-wider uppercase border border-border bg-background text-muted"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div
          ref={resultsRef}
          className="flex-1 overflow-y-auto p-3 space-y-4 max-h-[500px]"
        >
          {query.trim().length === 0 ? (
            /* Empty Query: Quick Actions */
            <div>
              <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                Quick Shortcuts & Actions
              </div>
              <div className="mt-1 space-y-1">
                {QUICK_ACTIONS.map((action, idx) => {
                  const Icon = action.icon;
                  const isSelected = selectedIndex === idx;
                  return (
                    <button
                      key={action.id}
                      data-item-index={idx}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelect(action)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-accent/10 border-accent/30 text-foreground"
                          : "hover:bg-background text-foreground/90 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-accent text-white"
                              : "bg-surface-elevated text-muted"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate leading-tight">
                            {action.title}
                          </p>
                          <p className="text-xs text-muted truncate mt-0.5">
                            {action.subtitle}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1 text-xs font-medium text-accent shrink-0 ml-3">
                          <span className="hidden sm:inline">Go</span>
                          <CornerDownLeft className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : flattenedItems.length === 0 && !isLoading ? (
            /* No Results Found */
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto mb-3">
                <Search className="w-6 h-6 text-muted" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                No matching results
              </h4>
              <p className="text-xs text-muted max-w-xs mx-auto mt-1">
                We couldn&apos;t find any hardware assets, support tickets, or staff
                matching &ldquo;{query}&rdquo;.
              </p>
            </div>
          ) : (
            /* Search Results Grouped */
            <div className="space-y-4">
              {/* Devices */}
              {results.devices.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    <Laptop className="w-3.5 h-3.5" />
                    <span>Hardware Assets ({results.devices.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.devices.map((device) => {
                      const itemIndex = flattenedItems.findIndex(
                        (i) => i.id === device.id
                      );
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={device.id}
                          data-item-index={itemIndex}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          onClick={() => handleSelect(device)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            isSelected
                              ? "bg-accent/10 border-accent/30 text-foreground"
                              : "hover:bg-background text-foreground/90 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-accent text-white"
                                  : "bg-surface-elevated text-muted"
                              }`}
                            >
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate leading-tight">
                                {device.title}
                              </p>
                              <p className="text-xs text-muted truncate mt-0.5">
                                {device.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {device.badge && (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                  device.badgeVariant === "success"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : device.badgeVariant === "info"
                                    ? "bg-brand-teal/10 text-brand-teal border-brand-teal/20"
                                    : "bg-surface-elevated text-foreground border-border"
                                }`}
                              >
                                {device.badge}
                              </span>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-accent" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Tickets */}
              {results.tickets.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Support Complaints ({results.tickets.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.tickets.map((ticket) => {
                      const itemIndex = flattenedItems.findIndex(
                        (i) => i.id === ticket.id
                      );
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={ticket.id}
                          data-item-index={itemIndex}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          onClick={() => handleSelect(ticket)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            isSelected
                              ? "bg-accent/10 border-accent/30 text-foreground"
                              : "hover:bg-background text-foreground/90 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-accent text-white"
                                  : "bg-surface-elevated text-muted"
                              }`}
                            >
                              <AlertCircle className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate leading-tight">
                                {ticket.title}
                              </p>
                              <p className="text-xs text-muted truncate mt-0.5">
                                {ticket.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {ticket.badge && (
                              <span
                                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                                  ticket.badgeVariant === "success"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : ticket.badgeVariant === "warning"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : "bg-surface-elevated text-foreground border-border"
                                }`}
                              >
                                {ticket.badge}
                              </span>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-accent" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Staff Directory */}
              {results.staff.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted">
                    <Users className="w-3.5 h-3.5" />
                    <span>Staff Directory ({results.staff.length})</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    {results.staff.map((member) => {
                      const itemIndex = flattenedItems.findIndex(
                        (i) => i.id === member.id
                      );
                      const isSelected = selectedIndex === itemIndex;
                      return (
                        <button
                          key={member.id}
                          data-item-index={itemIndex}
                          onMouseEnter={() => setSelectedIndex(itemIndex)}
                          onClick={() => handleSelect(member)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                            isSelected
                              ? "bg-accent/10 border-accent/30 text-foreground"
                              : "hover:bg-background text-foreground/90 border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-accent text-white"
                                  : "bg-surface-elevated text-muted"
                              }`}
                            >
                              <Users className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold truncate leading-tight">
                                {member.title}
                              </p>
                              <p className="text-xs text-muted truncate mt-0.5">
                                {member.subtitle}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {member.badge && (
                              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full border bg-surface-elevated text-foreground border-border">
                                {member.badge}
                              </span>
                            )}
                            {isSelected && (
                              <CornerDownLeft className="w-3.5 h-3.5 text-accent" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Shortcut Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-background border-t border-border text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-semibold text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-semibold text-[10px]">
                ↓
              </kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-semibold text-[10px]">
                ↵
              </kbd>
              <span>to select</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 rounded border border-border bg-surface font-semibold text-[10px]">
              ESC
            </kbd>
            <span>to close</span>
          </span>
        </div>
      </div>
    </div>
  );
}
