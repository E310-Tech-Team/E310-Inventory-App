"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  Download,
  Laptop,
  ArrowLeftRight,
  ChevronRight,
  CalendarClock,
} from "lucide-react";
import { Checkout, Item, Category } from "@/types";
import { getEffectiveStatus } from "@/lib/checkout-status";
import { CheckInModal } from "./CheckInModal";
import { CheckoutDetailsModal } from "./CheckoutDetailsModal";
import { ExtendDueDateModal } from "./ExtendDueDateModal";
import { Select } from "@/components/common/Select";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";

interface CheckoutsListProps {
  checkouts: Checkout[];
  items: Item[];
  categories: Category[];
  now?: number;
}

function getDaysOverdue(dueDate: string | Date | null, nowMs: number): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate).getTime();
  const diffDays = Math.ceil((nowMs - due) / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function CheckoutsList({
  checkouts,
  items,
  categories,
  now,
}: CheckoutsListProps) {
  const router = useRouter();
  const [mountNow] = useState(() => now ?? Date.now());
  const effectiveNow = now ?? mountNow;

  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "returned">("active");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [mobileLimit, setMobileLimit] = useState(6);

  const [checkingIn, setCheckingIn] = useState<Checkout | null>(null);
  const [extendingCheckout, setExtendingCheckout] = useState<Checkout | null>(null);
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [undoingCheckoutId, setUndoingCheckoutId] = useState<string | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const sorted = useMemo(
    () =>
      [...checkouts].sort(
        (a, b) => new Date(b.dateCollected).getTime() - new Date(a.dateCollected).getTime()
      ),
    [checkouts]
  );

  const kpis = useMemo(() => {
    let active = 0;
    let overdue = 0;
    let returned = 0;

    for (const c of checkouts) {
      const status = getEffectiveStatus(c);
      if (status === "active") active++;
      else if (status === "overdue") overdue++;
      else if (status === "returned") returned++;
    }

    return { total: checkouts.length, active, overdue, returned };
  }, [checkouts]);

  async function handleUndoCheckout(checkout: Checkout) {
    setUndoingCheckoutId(checkout.id);
    setUndoError(null);

    try {
      const response = await fetch(`/api/checkouts/${checkout.id}/undo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Couldn't undo check-in.");
      }

      setUndoingCheckoutId(null);
      router.refresh();
    } catch (err: unknown) {
      setUndoError(err instanceof Error ? err.message : "Failed to undo return");
      setUndoingCheckoutId(null);
    }
  }

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sorted.filter((checkout) => {
      const item = itemById.get(checkout.itemId);
      const status = getEffectiveStatus(checkout);
      const categoryName = item?.categoryId ? categoryById.get(item.categoryId)?.name : null;

      if (filter !== "all" && status !== filter) {
        return false;
      }

      if (categoryFilter !== "all" && item?.categoryId !== categoryFilter) {
        return false;
      }

      if (normalizedQuery) {
        const matches = [
          item?.name,
          item?.serialNumber,
          categoryName,
          checkout.collectedBy,
          checkout.assignedToName,
          checkout.assignedToPhone,
          checkout.assignedToEmail,
          checkout.quantity?.toString(),
          checkout.dateCollected,
          checkout.dueDate,
          checkout.dateReturned,
          status,
        ]
          .filter(Boolean)
          .some((val) => val!.toLowerCase().includes(normalizedQuery));

        if (!matches) return false;
      }

      return true;
    });
  }, [categoryById, categoryFilter, filter, itemById, query, sorted]);

  function exportCheckoutsCSV() {
    if (filtered.length === 0) return;

    const headers = [
      "Item Name",
      "Serial / Tag",
      "Category",
      "Staff Custodian",
      "Email",
      "Phone",
      "Collected By",
      "Date Collected",
      "Due Date",
      "Date Returned",
      "Effective Status",
      "Return Condition",
      "Notes",
    ];

    const rows = filtered.map((c) => {
      const item = itemById.get(c.itemId);
      const category = item ? categoryById.get(item.categoryId) : null;
      const status = getEffectiveStatus(c);

      return [
        `"${(item?.name || "Unknown").replace(/"/g, '""')}"`,
        `"${(item?.serialNumber || item?.identifierValue || "").replace(/"/g, '""')}"`,
        `"${(category?.name || "Uncategorized").replace(/"/g, '""')}"`,
        `"${(c.assignedToName || "").replace(/"/g, '""')}"`,
        `"${(c.assignedToEmail || "").replace(/"/g, '""')}"`,
        `"${(c.assignedToPhone || "").replace(/"/g, '""')}"`,
        `"${(c.collectedBy || "").replace(/"/g, '""')}"`,
        `"${new Date(c.dateCollected).toISOString().split("T")[0]}"`,
        c.dueDate ? `"${new Date(c.dueDate).toISOString().split("T")[0]}"` : "Open-ended",
        c.dateReturned ? `"${new Date(c.dateReturned).toISOString().split("T")[0]}"` : "Not Returned",
        `"${status}"`,
        `"${c.conditionOnReturn || c.conditionOnCollection || "good"}"`,
        `"${(c.collectionNotes || "").replace(/"/g, '""')}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `inventory-checkouts-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div>
      <PageHeader
        title="Checkouts & Loans"
        description="Track active hardware custody, return deadlines, extensions, and condition inspections."
        action={
          <button
            type="button"
            onClick={exportCheckoutsCSV}
            disabled={filtered.length === 0}
            className="pressable inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-foreground bg-surface border border-border/80 hover:bg-surface-elevated rounded-xl transition-colors disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5 text-muted" />
            <span>Export CSV</span>
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-6 sm:pb-12 space-y-4 sm:space-y-6">
        {/* Soft Overdue Notice Banner */}
        {kpis.overdue > 0 && filter !== "overdue" && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 sm:py-3.5 bg-rose-500/[0.06] border border-rose-500/20 rounded-2xl">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-medium text-rose-700 dark:text-rose-300">
                  {kpis.overdue} equipment {kpis.overdue === 1 ? "loan is" : "loans are"} overdue
                </p>
                <p className="hidden sm:block text-xs text-muted mt-0.5">
                  Staff custodians have passed their scheduled return date. Check in or extend due dates.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setFilter("overdue");
                setMobileLimit(6);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors self-start sm:self-auto shrink-0"
            >
              <span>Review overdue ({kpis.overdue})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              setFilter("active");
              setMobileLimit(6);
            }}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
              filter === "active"
                ? "border-accent/40 bg-accent/[0.03]"
                : "border-border/70 hover:border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Active Custody</span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.active}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">Currently issued to staff</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilter("overdue");
              setMobileLimit(6);
            }}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
              filter === "overdue"
                ? "border-rose-500/40 bg-rose-500/[0.03]"
                : "border-border/70 hover:border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Overdue Returns</span>
              <div
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center ${
                  kpis.overdue > 0
                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                    : "bg-surface-elevated/80 text-muted"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div
              className={`mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                kpis.overdue > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
              }`}
            >
              {kpis.overdue}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">Past scheduled return date</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilter("returned");
              setMobileLimit(6);
            }}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
              filter === "returned"
                ? "border-emerald-500/40 bg-emerald-500/[0.03]"
                : "border-border/70 hover:border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Checked In</span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.returned}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">Returned to inventory</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setMobileLimit(6);
            }}
            className={`text-left p-3.5 sm:p-5 rounded-2xl border bg-surface transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
              filter === "all"
                ? "border-accent/40 bg-accent/[0.03]"
                : "border-border/70 hover:border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Total Loans</span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface-elevated/80 text-muted flex items-center justify-center">
                <ArrowLeftRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.total}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">Full checkout history</p>
          </button>
        </div>

        {undoError && (
          <div className="px-4 py-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            {undoError}
          </div>
        )}

        {/* Unified Checkouts Table Panel */}
        <div className="bg-surface border border-border/70 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          {/* Search & Filter Header */}
          <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-border/60 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setMobileLimit(6);
                }}
                placeholder="Search equipment, staff, or custodian..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-xl focus:outline-hidden focus:border-accent text-foreground placeholder:text-muted transition-colors"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <div className="w-full sm:w-auto overflow-x-auto no-scrollbar">
                <div className="inline-flex min-w-full sm:min-w-0 p-0.5 bg-surface-elevated/70 rounded-xl border border-border/70 text-xs font-medium whitespace-nowrap">
                  {(["active", "overdue", "returned", "all"] as const).map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => {
                        setFilter(f);
                        setMobileLimit(6);
                      }}
                      className={`flex-1 sm:flex-initial justify-center px-3 py-1 rounded-lg capitalize transition-colors inline-flex items-center gap-1.5 ${
                        filter === f
                          ? "bg-surface text-foreground shadow-2xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      <span>{f}</span>
                      {f === "overdue" && kpis.overdue > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 font-semibold leading-none tabular-nums">
                          {kpis.overdue}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="w-full sm:w-44">
                <Select
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setMobileLimit(6);
                  }}
                  triggerClassName="py-1.5 px-2.5 text-xs bg-background border-border/80 rounded-xl"
                  options={[
                    { value: "all", label: "All Categories" },
                    ...categories.map((c) => ({ value: c.id, label: c.name })),
                  ]}
                />
              </div>

              {(query.trim() || categoryFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCategoryFilter("all");
                    setMobileLimit(6);
                  }}
                  className="p-1.5 text-muted hover:text-foreground text-xs inline-flex items-center gap-1"
                  title="Clear filters"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-11 h-11 rounded-full bg-surface-elevated border border-border/60 flex items-center justify-center mx-auto text-muted">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">No checkout records</h3>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                {filter === "overdue"
                  ? "No overdue equipment checkouts at this time."
                  : "No custody records matched your query or filter."}
              </p>
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-elevated/40 border-b border-border/60 text-xs font-medium text-muted">
                      <th className="py-3 px-5 font-medium">Equipment</th>
                      <th className="py-3 px-4 font-medium">Staff Custodian</th>
                      <th className="py-3 px-4 font-medium">Collected</th>
                      <th className="py-3 px-4 font-medium">Due / Returned</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-sm">
                    {filtered.map((checkout) => {
                      const item = itemById.get(checkout.itemId);
                      const status = getEffectiveStatus(checkout);
                      const daysOverdue =
                        status === "overdue" ? getDaysOverdue(checkout.dueDate, effectiveNow) : 0;

                      return (
                        <tr
                          key={checkout.id}
                          className="hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedCheckout(checkout)}
                        >
                          <td className="py-3.5 px-5">
                            <div className="font-medium text-foreground group-hover:text-accent transition-colors">
                              {item?.name ?? "Unknown item"}
                              {checkout.quantity !== null && (
                                <span className="text-muted font-normal">
                                  {" "}
                                  ({checkout.quantity} units)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted font-mono mt-0.5">
                              {item?.serialNumber || item?.identifierValue || "No SN"}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-medium text-foreground">
                              {checkout.assignedToName}
                            </div>
                            <div className="text-xs text-muted mt-0.5">
                              {checkout.assignedToEmail}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-xs text-muted tabular-nums">
                            <div className="text-foreground">
                              {new Date(checkout.dateCollected).toLocaleDateString()}
                            </div>
                            <div className="mt-0.5">by {checkout.collectedBy}</div>
                          </td>

                          <td className="py-3.5 px-4 text-xs tabular-nums">
                            {checkout.dueDate ? (
                              <div
                                className={
                                  status === "overdue"
                                    ? "text-rose-600 dark:text-rose-400 font-medium"
                                    : "text-foreground"
                                }
                              >
                                {new Date(checkout.dueDate).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-muted">Open-ended</span>
                            )}
                            {status === "returned" && checkout.dateReturned && (
                              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                                Returned {new Date(checkout.dateReturned).toLocaleDateString()}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {status === "overdue" ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>Overdue · {daysOverdue}d</span>
                              </span>
                            ) : (
                              <StatusPill status={status === "active" ? "active" : "returned"} />
                            )}
                          </td>

                          <td
                            className="py-3.5 px-5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              {status === "returned" ? (
                                <button
                                  type="button"
                                  onClick={() => handleUndoCheckout(checkout)}
                                  disabled={undoingCheckoutId === checkout.id}
                                  className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface border border-border/80 hover:bg-surface-elevated rounded-xl transition-colors disabled:opacity-50"
                                >
                                  {undoingCheckoutId === checkout.id ? "Undoing…" : "Undo"}
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => setExtendingCheckout(checkout)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-foreground bg-surface hover:bg-surface-elevated border border-border/80 rounded-xl transition-colors"
                                    title="Extend Due Date"
                                  >
                                    <CalendarClock className="w-3.5 h-3.5 text-muted" />
                                    <span>Extend</span>
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setCheckingIn(checkout)}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white text-xs font-semibold rounded-xl transition-colors shadow-2xs"
                                  >
                                    <span>Check In</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Compact Stack */}
              <div className="md:hidden">
                <div className="divide-y divide-border/50">
                  {filtered.slice(0, mobileLimit).map((checkout) => {
                    const item = itemById.get(checkout.itemId);
                    const status = getEffectiveStatus(checkout);
                    const daysOverdue =
                      status === "overdue" ? getDaysOverdue(checkout.dueDate, effectiveNow) : 0;

                    return (
                      <div
                        key={checkout.id}
                        className="px-3.5 py-2.5 bg-surface active:bg-surface-elevated/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedCheckout(checkout)}
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <h4 className="font-medium text-foreground text-sm truncate min-w-0">
                            {item?.name ?? "Unknown item"}
                          </h4>
                          {status === "overdue" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 shrink-0">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              <span>{daysOverdue}d overdue</span>
                            </span>
                          ) : (
                            <div className="shrink-0">
                              <StatusPill status={status === "active" ? "active" : "returned"} />
                            </div>
                          )}
                        </div>

                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <p className="text-xs text-muted min-w-0 truncate tabular-nums">
                            <span className="font-medium text-foreground">{checkout.assignedToName}</span>
                            {" · "}
                            <span className={status === "overdue" ? "text-rose-600 dark:text-rose-400 font-medium" : ""}>
                              {checkout.dueDate
                                ? `Due ${new Date(checkout.dueDate).toLocaleDateString()}`
                                : "Open"}
                            </span>
                          </p>

                          <div
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {status === "returned" ? (
                              <button
                                type="button"
                                onClick={() => handleUndoCheckout(checkout)}
                                disabled={undoingCheckoutId === checkout.id}
                                className="px-2.5 py-1 text-[11px] font-medium text-foreground bg-surface border border-border/80 rounded-lg transition-colors disabled:opacity-50"
                              >
                                {undoingCheckoutId === checkout.id ? "…" : "Undo"}
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setExtendingCheckout(checkout)}
                                  aria-label="Extend due date"
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-foreground bg-surface border border-border/80 rounded-lg transition-colors"
                                >
                                  <CalendarClock className="w-3 h-3 text-muted" />
                                  <span>Extend</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCheckingIn(checkout)}
                                  className="inline-flex items-center px-2.5 py-1 bg-accent hover:bg-accent-hover text-white text-[11px] font-semibold rounded-lg transition-colors shadow-2xs"
                                >
                                  <span>Check In</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ShowMoreBar
                  visibleCount={Math.min(mobileLimit, filtered.length)}
                  totalCount={filtered.length}
                  initialLimit={6}
                  noun="loans"
                  onShowMore={() => setMobileLimit((prev) => prev + 6)}
                  onCollapse={() => setMobileLimit(6)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedCheckout && (
        <CheckoutDetailsModal
          checkout={selectedCheckout}
          item={itemById.get(selectedCheckout.itemId) ?? null}
          category={
            itemById.get(selectedCheckout.itemId)?.categoryId
              ? categoryById.get(itemById.get(selectedCheckout.itemId)!.categoryId) ?? null
              : null
          }
          onClose={() => setSelectedCheckout(null)}
        />
      )}

      {checkingIn && (
        <CheckInModal
          checkout={checkingIn}
          itemName={itemById.get(checkingIn.itemId)?.name ?? "Equipment"}
          onClose={() => setCheckingIn(null)}
        />
      )}

      {extendingCheckout && (
        <ExtendDueDateModal
          checkout={extendingCheckout}
          itemName={itemById.get(extendingCheckout.itemId)?.name ?? "Equipment"}
          onClose={() => setExtendingCheckout(null)}
        />
      )}
    </div>
  );
}
