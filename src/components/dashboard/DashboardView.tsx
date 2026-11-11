"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  PackageX,
  ClipboardList,
  Search,
  CheckCircle2,
  ArrowRight,
  Download,
  ChevronRight,
} from "lucide-react";
import {
  FleetAssetsIcon,
  PriorityCriticalIcon,
  PriorityHighIcon,
  PriorityMediumIcon,
  PriorityLowIcon,
} from "@/components/common/Icons";

import { Category, Item, Checkout, DepartmentUser, Admin, DeviceComplaint } from "@/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";
import { CheckoutDetailsModal } from "@/components/checkouts/CheckoutDetailsModal";
import { CategoryDetailsModal } from "@/components/categories/CategoryDetailsModal";
import {
  getCheckedOutView,
  getOverdueView,
  getLowStockView,
  getCategoryBreakdown,
  getPersonHistory,
  getItemHistory,
} from "@/lib/dashboard";

const TABS = ["At a glance", "By category", "History"] as const;
type Tab = (typeof TABS)[number];

type ActiveViewFilter = "all" | "overdue";

export function DashboardView({
  categories,
  items,
  checkouts,
  complaints = [],
  now,
}: {
  categories: Category[];
  items: Item[];
  checkouts: Checkout[];
  complaints?: DeviceComplaint[];
  now: number;
  user?: DepartmentUser | Admin | null;
}) {
  const [tab, setTab] = useState<Tab>("At a glance");
  const [activeFilter, setActiveFilter] = useState<ActiveViewFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyMode, setHistoryMode] = useState<"item" | "person">("person");
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [custodyMobileLimit, setCustodyMobileLimit] = useState(4);
  const [categoryMobileLimit, setCategoryMobileLimit] = useState(8);
  const [historyMobileLimit, setHistoryMobileLimit] = useState(6);

  const checkedOut = useMemo(() => getCheckedOutView(checkouts, items), [checkouts, items]);
  const overdue = useMemo(() => getOverdueView(checkouts, items), [checkouts, items]);
  const lowStock = useMemo(() => getLowStockView(items, categories), [items, categories]);
  const breakdown = useMemo(() => getCategoryBreakdown(items, categories), [items, categories]);

  const openComplaints = useMemo(
    () => complaints.filter((c) => c.status !== "resolved" && c.status !== "closed"),
    [complaints]
  );

  // Only show active/open complaints in the overview queue so resolved tickets disappear here.
  const recentComplaints = useMemo(
    () =>
      [...openComplaints]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [openComplaints]
  );

  const people = useMemo(() => {
    const names = new Set([
      ...checkouts.map((checkout) => checkout.assignedToName || checkout.collectedBy),
    ]);
    return [...names].filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [checkouts]);

  const [selectedAdmin, setSelectedAdmin] = useState(people[0] ?? "");
  const activeSelectedAdmin = people.includes(selectedAdmin) ? selectedAdmin : people[0] ?? "";

  const itemHistory = useMemo(
    () => getItemHistory(checkouts, selectedItemId),
    [checkouts, selectedItemId]
  );
  const personHistory = useMemo(
    () => getPersonHistory(checkouts, activeSelectedAdmin),
    [activeSelectedAdmin, checkouts]
  );

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const filteredList = useMemo(() => {
    const base = activeFilter === "overdue" ? overdue : checkedOut;
    if (!searchQuery.trim()) return base;

    const query = searchQuery.toLowerCase();
    return base.filter(({ checkout, item }) => {
      const itemName = item?.name?.toLowerCase() || "";
      const personName = (checkout.assignedToName || checkout.collectedBy || "").toLowerCase();
      const contact = (checkout.assignedToEmail || checkout.assignedToPhone || "").toLowerCase();
      return itemName.includes(query) || personName.includes(query) || contact.includes(query);
    });
  }, [checkedOut, overdue, activeFilter, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Clean Executive Header ─── */}
      <div className="px-4 md:px-8 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-5 border-b border-border/70">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
              Inventory Overview
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">
              Hardware availability, active assignments, and operational alerts.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/exports"
              className="pressable inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl border border-border/80 bg-surface hover:bg-surface-elevated text-foreground text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-muted" />
              <span>Export data</span>
            </Link>
            <Link
              href="/checkouts"
              className="pressable inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <span>Checkouts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-1 mt-2.5 sm:mt-3 border-b border-border/70 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`pressable px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                tab === t
                  ? "border-accent text-accent font-semibold"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8 pb-6 sm:pb-12">
        {/* ─── TAB 1: AT A GLANCE ─── */}
        {tab === "At a glance" && (
          <div className="space-y-4 sm:space-y-6">
            {/* Top 4 KPI Metric Cards: compact 2x2 grid on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: Active Deployments */}
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className="text-left rounded-2xl border border-border/70 bg-surface hover:border-border p-3.5 sm:p-5 transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-medium text-muted truncate">
                    Active Deployments
                  </span>
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-accent-soft text-accent shrink-0">
                    <ClipboardList className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {checkedOut.length}
                </p>
                <p className="hidden sm:block text-xs text-muted mt-1">
                  Hardware items in staff custody
                </p>
              </button>

              {/* Card 2: Overdue Returns */}
              <button
                type="button"
                onClick={() => setActiveFilter(activeFilter === "overdue" ? "all" : "overdue")}
                className={`text-left rounded-2xl border p-3.5 sm:p-5 transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
                  activeFilter === "overdue"
                    ? "border-rose-500/40 bg-rose-500/[0.03]"
                    : "border-border/70 bg-surface hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-medium text-muted truncate">
                    Overdue Returns
                  </span>
                  <div
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0 ${
                      overdue.length > 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-surface-elevated/80 text-muted"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p
                  className={`mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                    overdue.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                  }`}
                >
                  {overdue.length}
                </p>
                <p className="hidden sm:block text-xs text-muted mt-1">
                  {overdue.length > 0 ? "Past scheduled due date" : "All returns on schedule"}
                </p>
              </button>

              {/* Card 3: Low Stock Supplies */}
              <button
                type="button"
                onClick={() => setTab("By category")}
                className="text-left rounded-2xl border border-border/70 bg-surface hover:border-border p-3.5 sm:p-5 transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-medium text-muted truncate">
                    Low Stock Alerts
                  </span>
                  <div
                    className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg shrink-0 ${
                      lowStock.length > 0
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                        : "bg-surface-elevated/80 text-muted"
                    }`}
                  >
                    <PackageX className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p
                  className={`mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                    lowStock.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                  }`}
                >
                  {lowStock.length}
                </p>
                <p className="hidden sm:block text-xs text-muted mt-1">
                  {lowStock.length > 0 ? "Below reorder threshold" : "All categories stocked"}
                </p>
              </button>

              {/* Card 4: Total Hardware Assets */}
              <Link
                href="/items"
                className="block rounded-2xl border border-border/70 bg-surface hover:border-border p-3.5 sm:p-5 transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] sm:text-xs font-medium text-muted truncate">
                    Total Catalog
                  </span>
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-surface-elevated/80 text-muted shrink-0">
                    <FleetAssetsIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                </div>
                <p className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
                  {items.length}
                </p>
                <p className="hidden sm:block text-xs text-muted mt-1">
                  Across {categories.length} equipment categories
                </p>
              </Link>
            </div>

            {/* ─── 2-Column Workspace Grid ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
              {/* Left Column (8 cols): Active Equipment Custody */}
              <div className="lg:col-span-8 rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-semibold text-foreground">
                        Active Equipment Custody
                      </h2>
                      <span className="text-xs text-muted tabular-nums">
                        ({filteredList.length})
                      </span>
                    </div>
                    <p className="hidden sm:block text-xs text-muted mt-0.5">
                      Devices currently issued to staff members
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <div className="relative flex-1 sm:flex-initial min-w-[150px]">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setCustodyMobileLimit(4);
                        }}
                        placeholder="Search custody..."
                        className="w-full sm:w-52 pl-8 pr-3 py-1.5 text-xs rounded-xl border border-border/80 bg-background text-foreground placeholder:text-muted focus:outline-hidden focus:border-accent transition-colors"
                      />
                    </div>

                    <div className="inline-flex items-center gap-0.5 bg-surface-elevated/70 p-0.5 rounded-xl border border-border/70 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter("all");
                          setCustodyMobileLimit(4);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          activeFilter === "all"
                            ? "bg-surface text-foreground shadow-2xs"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        All ({checkedOut.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFilter("overdue");
                          setCustodyMobileLimit(4);
                        }}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          activeFilter === "overdue"
                            ? "bg-surface text-rose-600 dark:text-rose-400 shadow-2xs"
                            : "text-muted hover:text-foreground"
                        }`}
                      >
                        Overdue ({overdue.length})
                      </button>
                    </div>
                  </div>
                </div>

                {filteredList.length === 0 ? (
                  <div className="text-center py-10 sm:py-14 px-4 space-y-2">
                    <div className="mx-auto w-9 h-9 rounded-full bg-surface-elevated flex items-center justify-center text-muted">
                      <CheckCircle2 className="w-4.5 h-4.5" />
                    </div>
                    <p className="text-sm font-medium text-foreground">
                      {activeFilter === "overdue" ? "No overdue returns" : "No devices found"}
                    </p>
                    <p className="text-xs text-muted max-w-xs mx-auto">
                      {activeFilter === "overdue"
                        ? "All assigned hardware is within scheduled loan dates."
                        : searchQuery
                        ? `No custody records match "${searchQuery}".`
                        : "No equipment is currently checked out."}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Mobile Compact Hairline Rows (Capped to minimize scroll) */}
                    <div className="sm:hidden">
                      <div className="divide-y divide-border/50">
                        {filteredList.slice(0, custodyMobileLimit).map(({ checkout, item }) => {
                          const assigneeName =
                            checkout.assignedToName || checkout.collectedBy || "Unknown Staff";
                          const isItemOverdue =
                            checkout.dueDate && new Date(checkout.dueDate).getTime() < now;

                          return (
                            <button
                              key={checkout.id}
                              type="button"
                              onClick={() => setSelectedCheckout(checkout)}
                              className="w-full text-left px-4 py-2.5 hover:bg-surface-elevated/40 transition-colors flex items-center justify-between gap-2.5"
                            >
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {item?.name || "Equipment Item"}
                                </p>
                                <p className="text-xs text-muted truncate mt-0.5 tabular-nums">
                                  {assigneeName} ·{" "}
                                  {checkout.dueDate
                                    ? `Due ${new Date(checkout.dueDate).toLocaleDateString()}`
                                    : "Permanent"}
                                </p>
                              </div>
                              <StatusPill
                                status={
                                  checkout.status === "returned"
                                    ? "returned"
                                    : isItemOverdue
                                    ? "overdue"
                                    : "active"
                                }
                              />
                            </button>
                          );
                        })}
                      </div>

                      <ShowMoreBar
                        visibleCount={custodyMobileLimit}
                        totalCount={filteredList.length}
                        initialLimit={4}
                        step={6}
                        noun="records"
                        onShowMore={() => setCustodyMobileLimit((c) => c + 6)}
                        onCollapse={() => setCustodyMobileLimit(4)}
                      />

                      <div className="px-4 py-2.5 border-t border-border/50 bg-surface-elevated/20 flex items-center justify-end text-xs">
                        <Link
                          href="/checkouts"
                          className="font-medium text-accent hover:underline inline-flex items-center gap-1"
                        >
                          <span>Manage all checkouts</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>

                    {/* Desktop Hairline Table */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/60 bg-surface-elevated/40 text-left text-xs font-medium text-muted">
                            <th className="px-5 py-3 font-medium">Equipment</th>
                            <th className="px-4 py-3 font-medium">Assigned To</th>
                            <th className="px-4 py-3 font-medium">Issued / Due</th>
                            <th className="px-4 py-3 font-medium">Status</th>
                            <th className="w-8 pr-4 py-3" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {filteredList.map(({ checkout, item }) => {
                            const assigneeName =
                              checkout.assignedToName || checkout.collectedBy || "Unknown Staff";
                            const isItemOverdue =
                              checkout.dueDate && new Date(checkout.dueDate).getTime() < now;
                            const categoryName = item?.categoryId
                              ? categoryById.get(item.categoryId)?.name
                              : undefined;

                            return (
                              <tr
                                key={checkout.id}
                                onClick={() => setSelectedCheckout(checkout)}
                                className="group cursor-pointer hover:bg-surface-elevated/40 transition-colors"
                              >
                                <td className="px-5 py-3.5">
                                  <p className="font-medium text-foreground">
                                    {item?.name || "Equipment Item"}
                                  </p>
                                  {categoryName && (
                                    <p className="text-xs text-muted mt-0.5">{categoryName}</p>
                                  )}
                                </td>
                                <td className="px-4 py-3.5">
                                  <p className="text-foreground font-medium">{assigneeName}</p>
                                  {checkout.assignedToEmail && (
                                    <p className="text-xs text-muted mt-0.5 truncate max-w-[200px]">
                                      {checkout.assignedToEmail}
                                    </p>
                                  )}
                                </td>
                                <td className="px-4 py-3.5 text-xs tabular-nums">
                                  <p className="text-foreground">
                                    {new Date(checkout.dateCollected).toLocaleDateString()}
                                  </p>
                                  <p
                                    className={`mt-0.5 ${
                                      isItemOverdue
                                        ? "text-rose-600 dark:text-rose-400 font-medium"
                                        : "text-muted"
                                    }`}
                                  >
                                    {checkout.dueDate
                                      ? `Due ${new Date(checkout.dueDate).toLocaleDateString()}`
                                      : "Permanent loan"}
                                  </p>
                                </td>
                                <td className="px-4 py-3.5">
                                  <StatusPill
                                    status={
                                      checkout.status === "returned"
                                        ? "returned"
                                        : isItemOverdue
                                        ? "overdue"
                                        : "active"
                                    }
                                  />
                                </td>
                                <td className="pr-4 py-3.5 text-right">
                                  <ChevronRight className="w-4 h-4 text-muted/60 group-hover:text-foreground inline transition-colors" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="hidden sm:flex px-5 py-3 border-t border-border/50 bg-surface-elevated/20 items-center justify-between text-xs">
                      <span className="text-muted">
                        Showing {filteredList.length} active custody record
                        {filteredList.length === 1 ? "" : "s"}
                      </span>
                      <Link
                        href="/checkouts"
                        className="font-medium text-accent hover:underline inline-flex items-center gap-1"
                      >
                        <span>Manage all checkouts</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </>
                )}
              </div>

              {/* Right Column (4 cols): Open Tickets & Desktop Category Allocation */}
              <div className="lg:col-span-4 space-y-4 sm:space-y-6">
                {/* Widget 1: Open Support Queue */}
                <div className="rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                  <div className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border/60 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm sm:text-base font-semibold text-foreground">
                          Open Support Queue
                        </h2>
                        {openComplaints.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums">
                            {openComplaints.length}
                          </span>
                        )}
                      </div>
                      <p className="hidden sm:block text-xs text-muted mt-0.5">
                        Unresolved staff hardware issues
                      </p>
                    </div>
                    <Link
                      href="/tech"
                      className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1 shrink-0"
                    >
                      <span>Open desk</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {recentComplaints.length === 0 ? (
                    <div className="px-4 py-7 sm:px-5 sm:py-10 text-center space-y-1.5 sm:space-y-2">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-emerald-500/80" />
                      <p className="text-sm font-medium text-foreground">All caught up</p>
                      <p className="text-xs text-muted">
                        No open staff tickets require attention right now.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {recentComplaints.map((c, idx) => {
                        const prio = (c.severity || c.priority || "medium").toLowerCase();
                        const PrioIcon =
                          prio === "critical"
                            ? PriorityCriticalIcon
                            : prio === "high"
                            ? PriorityHighIcon
                            : prio === "low"
                            ? PriorityLowIcon
                            : PriorityMediumIcon;

                        const isUnderway =
                          c.status === "in-progress" ||
                          c.status === "in-repair" ||
                          c.status === "assigned" ||
                          c.status === "under-review";

                        return (
                          <Link
                            key={c.id}
                            href={`/tech?ticket=${c.ticketNumber}`}
                            className={`group block px-4 py-3 sm:px-5 sm:py-3.5 hover:bg-surface-elevated/40 transition-colors ${
                              idx >= 3 ? "hidden lg:block" : ""
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-0.5 sm:mb-1">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-mono text-[11px] font-medium text-muted">
                                  {c.ticketNumber}
                                </span>
                                <span className="inline-flex items-center gap-1 text-[11px] text-muted capitalize">
                                  <PrioIcon className="w-3 h-3" />
                                  <span>{prio}</span>
                                </span>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full capitalize border shrink-0 ${
                                  isUnderway
                                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                }`}
                              >
                                {c.status.replace("-", " ")}
                              </span>
                            </div>

                            <p className="text-sm font-medium text-foreground truncate group-hover:text-accent transition-colors">
                              {c.title}
                            </p>
                            <p className="text-xs text-muted truncate mt-0.5">
                              {c.itemName || c.deviceSummary || "Hardware Device"} ·{" "}
                              {c.userName || "Staff"}
                            </p>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Widget 2: Category Allocation (Desktop sidebar; accessible via "By category" tab on mobile) */}
                <div className="hidden lg:block rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                  <div className="px-5 py-4 border-b border-border/60 flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        Category Allocation
                      </h2>
                      <p className="text-xs text-muted mt-0.5">Fleet deployment by group</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("By category")}
                      className="text-xs font-medium text-accent hover:underline inline-flex items-center gap-1"
                    >
                      <span>View all</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-border/40">
                    {breakdown.slice(0, 6).map(({ category, totalItems, checkedOut: inUse, available, lowStock: catLowStock }) => {
                      const deployedPct =
                        totalItems > 0 ? Math.round((inUse / totalItems) * 100) : 0;

                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => setSelectedCategory(category)}
                          className="w-full text-left px-5 py-3.5 hover:bg-surface-elevated/40 transition-colors"
                        >
                          <div className="flex items-center justify-between text-xs gap-2">
                            <span className="font-medium text-foreground truncate">
                              {category.name}
                            </span>
                            <span className="text-muted tabular-nums shrink-0">
                              <span className="text-foreground font-medium">{inUse}</span> /{" "}
                              {totalItems}
                            </span>
                          </div>

                          <div className="mt-2 w-full h-1 rounded-full bg-surface-elevated overflow-hidden flex">
                            <div
                              style={{ width: `${deployedPct}%` }}
                              className="h-full bg-accent transition-all duration-300 rounded-full"
                            />
                            {catLowStock > 0 && (
                              <div
                                style={{
                                  width: `${Math.round((catLowStock / (totalItems || 1)) * 100)}%`,
                                }}
                                className="h-full bg-amber-500 transition-all duration-300"
                              />
                            )}
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted tabular-nums">
                            <span>{deployedPct}% deployed</span>
                            <span>{available} available</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: BY CATEGORY ─── */}
        {tab === "By category" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Category Stock Breakdown
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Equipment volumes, field deployment, and reorder levels.
                </p>
              </div>
            </div>

            <Table
              headers={["Category", "Total Items", "Assigned", "Available", "Low Stock"]}
              mobileCards={
                <div className="rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                  <ul className="divide-y divide-border/50">
                    {breakdown
                      .slice(0, categoryMobileLimit)
                      .map(({ category, totalItems, checkedOut: inUse, available, lowStock: catLowStock }) => (
                        <li
                          key={category.id}
                          className="cursor-pointer px-3.5 py-2.5 hover:bg-surface-elevated/40 transition-colors"
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedCategory(category)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              setSelectedCategory(category);
                            }
                          }}
                        >
                          <div className="flex items-center justify-between gap-2.5">
                            <p className="font-semibold text-sm text-foreground truncate min-w-0">
                              {category.name}
                            </p>
                            {catLowStock > 0 ? (
                              <span className="inline-flex shrink-0 items-center rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                                {catLowStock} low
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-muted shrink-0 tabular-nums">
                                {totalItems} {totalItems === 1 ? "item" : "items"}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted mt-0.5 tabular-nums truncate">
                            {inUse} assigned · {available} available · {catLowStock} low stock
                          </p>
                        </li>
                      ))}
                  </ul>
                  <ShowMoreBar
                    visibleCount={Math.min(categoryMobileLimit, breakdown.length)}
                    totalCount={breakdown.length}
                    initialLimit={8}
                    noun="categories"
                    onShowMore={() => setCategoryMobileLimit((prev) => prev + 8)}
                    onCollapse={() => setCategoryMobileLimit(8)}
                  />
                </div>
              }
            >
              {breakdown.map(({ category, totalItems, checkedOut: inUse, available, lowStock: catLowStock }) => (
                <tr
                  key={category.id}
                  className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-surface-elevated/40 text-foreground transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedCategory(category)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      setSelectedCategory(category);
                    }
                  }}
                >
                  <Td>
                    <span className="font-medium text-foreground">{category.name}</span>
                  </Td>
                  <Td muted mono>
                    {totalItems}
                  </Td>
                  <Td muted mono>
                    {inUse}
                  </Td>
                  <Td muted mono>
                    {available}
                  </Td>
                  <td className="px-4 py-3 font-mono text-xs tabular-nums">
                    {catLowStock > 0 ? (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {catLowStock}
                      </span>
                    ) : (
                      <span className="text-muted">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          </div>
        )}

        {/* ─── TAB 3: AUDIT HISTORY ─── */}
        {tab === "History" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Equipment Loan Audit History
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Complete log of all custody transfers and returns.
                </p>
              </div>

              <div className="inline-flex gap-0.5 bg-surface-elevated/70 p-0.5 rounded-xl border border-border/70 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setHistoryMode("person");
                    setHistoryMobileLimit(6);
                  }}
                  className={`pressable px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    historyMode === "person"
                      ? "bg-surface text-foreground shadow-2xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  By Person
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHistoryMode("item");
                    setHistoryMobileLimit(6);
                  }}
                  className={`pressable px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    historyMode === "item"
                      ? "bg-surface text-foreground shadow-2xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  By Equipment Item
                </button>
              </div>
            </div>

            {historyMode === "person" ? (
              <>
                {people.length > 0 && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <span className="text-xs text-muted font-medium">Staff member:</span>
                    <select
                      className="w-full sm:w-auto max-w-full px-3 py-1.5 rounded-xl border border-border/80 bg-surface text-foreground text-xs font-medium focus:outline-hidden focus:border-accent"
                      value={activeSelectedAdmin}
                      onChange={(e) => {
                        setSelectedAdmin(e.target.value);
                        setHistoryMobileLimit(6);
                      }}
                    >
                      {people.map((name) => (
                        <option key={name} value={name}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {personHistory.length === 0 ? (
                  <EmptyRow text="No checkout history found for this person." />
                ) : (
                  <Table
                    headers={[
                      "Item",
                      "Assigned Date",
                      "Returned Date",
                      "Processed By",
                      "Condition",
                      "Status",
                    ]}
                    mobileCards={
                      <div className="rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                        <ul className="divide-y divide-border/50">
                          {personHistory.slice(0, historyMobileLimit).map((c) => {
                            const status =
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate).getTime() < now
                                ? "overdue"
                                : "active";
                            return (
                              <li
                                key={c.id}
                                className="cursor-pointer px-3.5 py-2.5 hover:bg-surface-elevated/40 transition-colors"
                                role="button"
                                tabIndex={0}
                                onClick={() =>
                                  setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout)
                                }
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2.5">
                                  <p className="font-semibold text-sm text-foreground truncate min-w-0">
                                    {itemById.get(c.itemId)?.name ?? "Unknown"}
                                  </p>
                                  <div className="shrink-0">
                                    <StatusPill status={status} />
                                  </div>
                                </div>
                                <p className="text-xs text-muted mt-0.5 truncate tabular-nums">
                                  {new Date(c.dateCollected).toLocaleDateString()}
                                  {c.dateReturned
                                    ? ` → ${new Date(c.dateReturned).toLocaleDateString()}`
                                    : " · Open"}
                                  {` · ${c.conditionOnReturn ?? c.conditionOnCollection}`}
                                  {` · ${c.collectedBy}`}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                        <ShowMoreBar
                          visibleCount={Math.min(historyMobileLimit, personHistory.length)}
                          totalCount={personHistory.length}
                          initialLimit={6}
                          noun="records"
                          onShowMore={() => setHistoryMobileLimit((prev) => prev + 6)}
                          onCollapse={() => setHistoryMobileLimit(6)}
                        />
                      </div>
                    }
                  >
                    {personHistory.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-surface-elevated/40 text-foreground transition-colors"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout)
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout);
                          }
                        }}
                      >
                        <Td>
                          <span className="font-medium">
                            {itemById.get(c.itemId)?.name ?? "Unknown"}
                          </span>
                        </Td>
                        <Td muted>{new Date(c.dateCollected).toLocaleDateString()}</Td>
                        <Td muted>
                          {c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}
                        </Td>
                        <Td muted>{c.collectedBy}</Td>
                        <Td muted capitalize>
                          {c.conditionOnReturn ?? c.conditionOnCollection}
                        </Td>
                        <td className="px-4 py-3">
                          <StatusPill
                            status={
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate).getTime() < now
                                ? "overdue"
                                : "active"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                  <span className="text-xs text-muted font-medium">Equipment item:</span>
                  <select
                    className="w-full sm:w-auto max-w-full px-3 py-1.5 rounded-xl border border-border/80 bg-surface text-foreground text-xs font-medium focus:outline-hidden focus:border-accent"
                    value={selectedItemId}
                    onChange={(e) => {
                      setSelectedItemId(e.target.value);
                      setHistoryMobileLimit(6);
                    }}
                  >
                    {items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </div>
                {itemHistory.length === 0 ? (
                  <EmptyRow text="No checkout history found for this item." />
                ) : (
                  <Table
                    headers={[
                      "Assigned To",
                      "Assigned Date",
                      "Returned Date",
                      "Processed By",
                      "Condition",
                      "Status",
                    ]}
                    mobileCards={
                      <div className="rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                        <ul className="divide-y divide-border/50">
                          {itemHistory.slice(0, historyMobileLimit).map((c) => {
                            const status =
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate).getTime() < now
                                ? "overdue"
                                : "active";
                            return (
                              <li
                                key={c.id}
                                className="cursor-pointer px-3.5 py-2.5 hover:bg-surface-elevated/40 transition-colors"
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedCheckout(c)}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" || event.key === " ") {
                                    event.preventDefault();
                                    setSelectedCheckout(c);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2.5">
                                  <p className="font-semibold text-sm text-foreground truncate min-w-0">
                                    {c.assignedToName || c.collectedBy}
                                  </p>
                                  <div className="shrink-0">
                                    <StatusPill status={status} />
                                  </div>
                                </div>
                                <p className="text-xs text-muted mt-0.5 truncate tabular-nums">
                                  {new Date(c.dateCollected).toLocaleDateString()}
                                  {c.dateReturned
                                    ? ` → ${new Date(c.dateReturned).toLocaleDateString()}`
                                    : " · Open"}
                                  {` · ${c.conditionOnReturn ?? c.conditionOnCollection}`}
                                  {` · ${c.collectedBy}`}
                                </p>
                              </li>
                            );
                          })}
                        </ul>
                        <ShowMoreBar
                          visibleCount={Math.min(historyMobileLimit, itemHistory.length)}
                          totalCount={itemHistory.length}
                          initialLimit={6}
                          noun="records"
                          onShowMore={() => setHistoryMobileLimit((prev) => prev + 6)}
                          onCollapse={() => setHistoryMobileLimit(6)}
                        />
                      </div>
                    }
                  >
                    {itemHistory.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border/50 last:border-0 cursor-pointer hover:bg-surface-elevated/40 text-foreground transition-colors"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCheckout(c)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedCheckout(c);
                          }
                        }}
                      >
                        <Td>
                          <span className="font-medium">
                            {c.assignedToName || c.collectedBy}
                          </span>
                        </Td>
                        <Td muted>{new Date(c.dateCollected).toLocaleDateString()}</Td>
                        <Td muted>
                          {c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}
                        </Td>
                        <Td muted>{c.collectedBy}</Td>
                        <Td muted capitalize>
                          {c.conditionOnReturn ?? c.conditionOnCollection}
                        </Td>
                        <td className="px-4 py-3">
                          <StatusPill
                            status={
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate).getTime() < now
                                ? "overdue"
                                : "active"
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </Table>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* ─── Modals ─── */}
      {selectedCheckout &&
        (() => {
          const selectedItemForCheckout = itemById.get(selectedCheckout.itemId) ?? null;
          const selectedCategoryForCheckout = selectedItemForCheckout?.categoryId
            ? categoryById.get(selectedItemForCheckout.categoryId) ?? null
            : null;

          return (
            <CheckoutDetailsModal
              checkout={selectedCheckout}
              item={selectedItemForCheckout}
              category={selectedCategoryForCheckout}
              onClose={() => setSelectedCheckout(null)}
            />
          );
        })()}

      {selectedCategory && (
        <CategoryDetailsModal
          category={selectedCategory}
          itemCount={items.filter((item) => item.categoryId === selectedCategory.id).length}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </div>
  );
}

function Table({
  headers,
  children,
  mobileCards,
}: {
  headers: string[];
  children: React.ReactNode;
  mobileCards?: React.ReactNode;
}) {
  return (
    <div className="space-y-3 md:space-y-0">
      {mobileCards && <div className="md:hidden space-y-3">{mobileCards}</div>}
      <div className="hidden md:block border border-border/70 rounded-2xl overflow-hidden bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-surface-elevated/40 text-left text-xs font-medium text-muted">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-medium whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function Td({
  children,
  muted,
  mono,
  capitalize,
}: {
  children: React.ReactNode;
  muted?: boolean;
  mono?: boolean;
  capitalize?: boolean;
}) {
  return (
    <td
      className={`px-4 py-3.5 ${muted ? "text-muted" : "text-foreground"} ${
        mono ? "font-mono text-xs tabular-nums" : ""
      } ${capitalize ? "capitalize" : ""}`}
    >
      {children}
    </td>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="border border-border/70 rounded-2xl py-12 text-center bg-surface">
      <p className="text-sm font-medium text-muted">{text}</p>
    </div>
  );
}
