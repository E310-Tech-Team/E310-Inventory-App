"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  AlertTriangle,
  Clock,
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

interface CheckoutsListProps {
  checkouts: Checkout[];
  items: Item[];
  categories: Category[];
}

function getDaysOverdue(dueDate: string | Date | null): number {
  if (!dueDate) return 0;
  const due = new Date(dueDate).getTime();
  const now = new Date().getTime();
  const diffTime = now - due;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export function CheckoutsList({
  checkouts,
  items,
  categories,
}: CheckoutsListProps) {
  const router = useRouter();

  // Filter & Search states
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "returned">("active");
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Modals state
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

  // Compute KPIs
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

  // Filtered checkouts
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

  // CSV Export
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
    <div className="space-y-6">
      {/* Overdue Alert Banner if items are overdue */}
      {kpis.overdue > 0 && filter !== "overdue" && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-500/10 border border-rose-500/25 rounded-xl shadow-xs animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rose-400">
                {kpis.overdue} equipment {kpis.overdue === 1 ? "checkout is" : "checkouts are"} currently overdue!
              </p>
              <p className="text-xs text-muted mt-0.5">
                Staff custodians have exceeded return deadlines. Check in or extend due dates.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFilter("overdue")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors self-start sm:self-auto shadow-xs"
          >
            <span>Review Overdue Items ({kpis.overdue})</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setFilter("active")}
          className={`text-left p-5 rounded-xl border transition-all ${
            filter === "active"
              ? "bg-brand-teal/10 border-brand-teal/30 ring-2 ring-brand-teal/20 shadow-xs"
              : "bg-surface border-border hover:border-brand-teal/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Active Custody
            </span>
            <div className="p-2 rounded-lg bg-brand-teal/10 text-brand-teal">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-foreground">{kpis.active}</div>
          <p className="mt-1 text-xs text-muted">Currently in staff hands</p>
        </button>

        <button
          onClick={() => setFilter("overdue")}
          className={`text-left p-5 rounded-xl border transition-all ${
            filter === "overdue"
              ? "bg-rose-500/10 border-rose-500/30 ring-2 ring-rose-500/20 shadow-xs"
              : "bg-surface border-border hover:border-rose-500/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Overdue Returns
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-400">{kpis.overdue}</div>
          <p className="mt-1 text-xs text-muted">Exceeded scheduled return date</p>
        </button>

        <button
          onClick={() => setFilter("returned")}
          className={`text-left p-5 rounded-xl border transition-all ${
            filter === "returned"
              ? "bg-emerald-500/10 border-emerald-500/30 ring-2 ring-emerald-500/20 shadow-xs"
              : "bg-surface border-border hover:border-emerald-500/40 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Checked In
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-foreground">{kpis.returned}</div>
          <p className="mt-1 text-xs text-muted">Returned to inventory</p>
        </button>

        <button
          onClick={() => setFilter("all")}
          className={`text-left p-5 rounded-xl border transition-all ${
            filter === "all"
              ? "bg-surface-elevated border-border ring-2 ring-brand-teal/20 shadow-xs"
              : "bg-surface border-border hover:border-brand-teal/30 shadow-xs"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Recorded
            </span>
            <div className="p-2 rounded-lg bg-surface-elevated text-foreground">
              <ArrowLeftRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-foreground">{kpis.total}</div>
          <p className="mt-1 text-xs text-muted">Full checkout log history</p>
        </button>
      </div>

      {/* Main Filter & Search Toolbar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by equipment, staff name, email, or collected by..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-elevated border border-border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal text-foreground placeholder-muted transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={exportCheckoutsCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-foreground bg-surface border border-border hover:bg-surface-elevated rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Tabs & Category Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="inline-flex p-1 bg-surface-elevated rounded-lg border border-border text-xs font-medium text-muted">
            {(["active", "overdue", "returned", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                  filter === f
                    ? "bg-surface text-foreground font-semibold shadow-xs"
                    : "text-muted hover:text-foreground"
                }`}
              >
                {f}
                {f === "overdue" && kpis.overdue > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-bold">
                    {kpis.overdue}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="w-48">
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                triggerClassName="py-1 px-2.5 text-xs bg-surface-elevated rounded-lg"
                options={[
                  { value: "all", label: "All Categories" },
                  ...categories.map((c) => ({ value: c.id, label: c.name })),
                ]}
              />
            </div>

            {(query.trim() || categoryFilter !== "all") && (
              <button
                onClick={() => {
                  setQuery("");
                  setCategoryFilter("all");
                }}
                className="p-1.5 text-muted hover:text-foreground text-xs flex items-center gap-1"
                title="Clear filters"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {undoError && (
        <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          {undoError}
        </div>
      )}

      {/* Checkouts Table Container */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-muted">
              <ArrowLeftRight className="w-6 h-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No checkout records</h3>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
              {filter === "overdue"
                ? "Excellent! There are no overdue equipment checkouts at this time."
                : "No custody records matched your query or filter criteria."}
            </p>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-elevated/70 border-b border-border text-xs font-semibold text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-4">Equipment & Model</th>
                    <th className="py-3.5 px-4">Staff Custodian</th>
                    <th className="py-3.5 px-4">Collected</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filtered.map((checkout) => {
                    const item = itemById.get(checkout.itemId);
                    const status = getEffectiveStatus(checkout);
                    const daysOverdue = status === "overdue" ? getDaysOverdue(checkout.dueDate) : 0;

                    return (
                      <tr
                        key={checkout.id}
                        className={`hover:bg-surface-elevated/50 transition-colors group cursor-pointer ${
                          status === "overdue" ? "bg-rose-500/10" : ""
                        }`}
                        onClick={() => setSelectedCheckout(checkout)}
                      >
                        {/* Equipment */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                status === "overdue"
                                  ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                  : "bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
                              }`}
                            >
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground group-hover:text-brand-teal transition-colors">
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
                            </div>
                          </div>
                        </td>

                        {/* Staff Custodian */}
                        <td className="py-4 px-4">
                          <div className="font-medium text-foreground">
                            {checkout.assignedToName}
                          </div>
                          <div className="text-xs text-muted mt-0.5">
                            {checkout.assignedToEmail}
                          </div>
                        </td>

                        {/* Date Collected */}
                        <td className="py-4 px-4 text-xs text-muted">
                          <div>{new Date(checkout.dateCollected).toLocaleDateString()}</div>
                          <div className="text-[11px] text-muted/70 mt-0.5">
                            by {checkout.collectedBy}
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="py-4 px-4 text-xs">
                          {checkout.dueDate ? (
                            <div
                              className={`font-mono font-medium ${
                                status === "overdue" ? "text-rose-400 font-bold" : "text-foreground"
                              }`}
                            >
                              {new Date(checkout.dueDate).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-muted">Open-ended</span>
                          )}
                          {status === "returned" && checkout.dateReturned && (
                            <div className="text-[11px] text-emerald-400 mt-0.5">
                              Returned {new Date(checkout.dateReturned).toLocaleDateString()}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4">
                          {status === "overdue" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                              Overdue ({daysOverdue}d)
                            </span>
                          ) : status === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                              <Clock className="w-3 h-3" />
                              Active Custody
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" />
                              Returned
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-4 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1.5">
                            {status === "returned" ? (
                              <button
                                onClick={() => handleUndoCheckout(checkout)}
                                disabled={undoingCheckoutId === checkout.id}
                                className="px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground bg-surface border border-border hover:bg-surface-elevated rounded-lg transition-colors disabled:opacity-50"
                              >
                                {undoingCheckoutId === checkout.id ? "Undoing…" : "Undo"}
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => setExtendingCheckout(checkout)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-teal bg-brand-teal/10 hover:bg-brand-teal/20 border border-brand-teal/30 rounded-lg transition-colors"
                                  title="Extend Due Date"
                                >
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  <span>Extend</span>
                                </button>

                                <button
                                  onClick={() => setCheckingIn(checkout)}
                                  className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
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

            {/* Mobile Card Stack */}
            <div className="md:hidden divide-y divide-border">
              {filtered.map((checkout) => {
                const item = itemById.get(checkout.itemId);
                const status = getEffectiveStatus(checkout);
                const daysOverdue = status === "overdue" ? getDaysOverdue(checkout.dueDate) : 0;

                return (
                  <div
                    key={checkout.id}
                    className={`p-4 space-y-3 cursor-pointer transition-colors active:bg-surface-elevated ${
                      status === "overdue" ? "bg-rose-500/10" : "bg-surface"
                    }`}
                    onClick={() => setSelectedCheckout(checkout)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            status === "overdue"
                              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              : "bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
                          }`}
                        >
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">
                            {item?.name ?? "Unknown item"}
                          </h4>
                          <span className="font-mono text-[11px] text-muted">
                            {item?.serialNumber || item?.identifierValue || "No SN"}
                          </span>
                        </div>
                      </div>

                      {status === "overdue" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse shrink-0">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          Overdue ({daysOverdue}d)
                        </span>
                      ) : status === "active" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/20 shrink-0">
                          <Clock className="w-3 h-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Returned
                        </span>
                      )}
                    </div>

                    {/* Custodian & Due Date */}
                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div>
                        <span className="text-[10px] text-muted block">
                          Custodian
                        </span>
                        <span className="font-medium text-foreground truncate block">
                          {checkout.assignedToName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted block">
                          Due Date
                        </span>
                        <span
                          className={`font-mono text-xs block ${
                            status === "overdue" ? "text-rose-400 font-bold" : "text-foreground"
                          }`}
                        >
                          {checkout.dueDate
                            ? new Date(checkout.dueDate).toLocaleDateString()
                            : "Open-ended"}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center justify-end gap-1.5 pt-2 border-t border-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {status === "returned" ? (
                        <button
                          onClick={() => handleUndoCheckout(checkout)}
                          disabled={undoingCheckoutId === checkout.id}
                          className="px-3 py-1 text-xs font-medium text-muted bg-surface border border-border rounded-lg transition-colors disabled:opacity-50"
                        >
                          {undoingCheckoutId === checkout.id ? "Undoing…" : "Undo"}
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setExtendingCheckout(checkout)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-brand-teal bg-brand-teal/10 border border-brand-teal/30 rounded-lg transition-colors"
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            <span>Extend</span>
                          </button>
                          <button
                            onClick={() => setCheckingIn(checkout)}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
                          >
                            <span>Check In</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
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