"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  PackageX,
  ClipboardList,
  Sparkles,
  ArrowUpRight,
  Boxes,
  Package,
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  ArrowRight,
  Filter,
  Monitor,
  Laptop,
} from "lucide-react";

import { Category, Item, Checkout, DepartmentUser, Admin } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { CheckoutDetailsModal } from "@/components/checkouts/CheckoutDetailsModal";
import { CategoryDetailsModal } from "@/components/categories/CategoryDetailsModal";
import { ItemDetailsModal } from "@/components/items/ItemDetailsModal";
import {
  getCheckedOutView,
  getOverdueView,
  getLowStockView,
  getCategoryBreakdown,
  getPersonHistory,
  getItemHistory,
  getRecentlyAddedView,
} from "@/lib/dashboard";

const TABS = ["At a glance", "By category", "History"] as const;
type Tab = (typeof TABS)[number];

type ActiveViewFilter = "all" | "overdue" | "recent";

export function DashboardView({
  categories,
  items,
  checkouts,
  now,
  user,
}: {
  categories: Category[];
  items: Item[];
  checkouts: Checkout[];
  now: number;
  user?: DepartmentUser | Admin | null;
}) {
  const [tab, setTab] = useState<Tab>("At a glance");
  const [activeFilter, setActiveFilter] = useState<ActiveViewFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyMode, setHistoryMode] = useState<"item" | "person">("person");
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const checkedOut = useMemo(() => getCheckedOutView(checkouts, items), [checkouts, items]);
  const overdue = useMemo(() => getOverdueView(checkouts, items), [checkouts, items]);
  const lowStock = useMemo(() => getLowStockView(items, categories), [items, categories]);
  const recentlyAdded = useMemo(() => getRecentlyAddedView(items), [items]);
  const breakdown = useMemo(() => getCategoryBreakdown(items, categories), [items, categories]);

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

  // Filtered list for "At a glance" active custody card
  const filteredList = useMemo(() => {
    let list = checkedOut;
    if (activeFilter === "overdue") {
      list = overdue;
    }

    if (!searchQuery.trim()) return list;

    const query = searchQuery.toLowerCase();
    return list.filter(({ checkout, item }) => {
      const itemName = item?.name?.toLowerCase() || "";
      const personName = (checkout.assignedToName || checkout.collectedBy || "").toLowerCase();
      const contact = (checkout.assignedToEmail || checkout.assignedToPhone || "").toLowerCase();
      return itemName.includes(query) || personName.includes(query) || contact.includes(query);
    });
  }, [checkedOut, overdue, activeFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ─── Top Page Header with Status & Quick Actions ─── */}
      <div className="px-4 md:px-8 pt-6 pb-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-border">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {user?.name || "User"}
            </h1>
            <p className="text-sm text-muted mt-1">
              Real-time hardware inventory, active field custody, and fleet health monitoring.
            </p>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link
              href="/checkouts"
              className="pressable inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-brand-yellow text-brand-navy font-bold text-xs shadow-xs hover:brightness-105 transition-all"
            >
              <ClipboardList className="w-4 h-4" />
              <span>Loans & Checkouts</span>
            </Link>
            <Link
              href="/items"
              className="pressable inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground font-semibold text-xs hover:bg-surface-elevated transition-colors"
            >
              <Package className="w-4 h-4 text-muted" />
              <span>Inventory Catalog</span>
            </Link>
            <Link
              href="/tech/approvals"
              className="pressable inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface border border-border text-foreground font-semibold text-xs hover:bg-surface-elevated transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-brand-teal" />
              <span>Approvals Queue</span>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mt-4 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`pressable px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                tab === t
                  ? "border-accent text-accent"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8 pb-12">
        {/* ─── TAB 1: AT A GLANCE (EXECUTIVE DASHBOARD) ─── */}
        {tab === "At a glance" && (
          <div className="space-y-6">
            {/* Top 4 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: In Active Custody */}
              <div
                onClick={() => setActiveFilter("all")}
                className={`interactive-card cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                  activeFilter === "all"
                    ? "border-brand-teal/50 bg-brand-teal/5 dark:bg-brand-teal/10 shadow-xs ring-1 ring-brand-teal/30"
                    : "border-border bg-surface hover:border-brand-teal/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-teal/15 text-brand-teal dark:text-teal-400">
                    <ClipboardList className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-teal/10 text-brand-teal dark:text-teal-400">
                    In Field
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                    {checkedOut.length}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80 mt-1">
                    Active Deployments
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Hardware items in staff custody
                  </p>
                </div>
              </div>

              {/* Card 2: Overdue Returns */}
              <div
                onClick={() => setActiveFilter("overdue")}
                className={`interactive-card cursor-pointer rounded-2xl border p-5 transition-all duration-200 ${
                  activeFilter === "overdue"
                    ? "border-rose-500/50 bg-rose-500/5 dark:bg-rose-500/10 shadow-xs ring-1 ring-rose-500/30"
                    : "border-border bg-surface hover:border-rose-500/40"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      overdue.length > 0
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      overdue.length > 0
                        ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {overdue.length > 0 ? "Urgent" : "Nominal"}
                  </span>
                </div>
                <div className="mt-4">
                  <p
                    className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      overdue.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                    }`}
                  >
                    {overdue.length}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80 mt-1">
                    Overdue Returns
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {overdue.length > 0 ? "Exceeded scheduled due date" : "All returns on schedule"}
                  </p>
                </div>
              </div>

              {/* Card 3: Low Stock Alerts */}
              <div
                onClick={() => setTab("By category")}
                className="interactive-card cursor-pointer rounded-2xl border border-border bg-surface p-5 hover:border-amber-500/40 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      lowStock.length > 0
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    <PackageX className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      lowStock.length > 0
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    {lowStock.length > 0 ? "Restock" : "Sufficient"}
                  </span>
                </div>
                <div className="mt-4">
                  <p
                    className={`text-3xl sm:text-4xl font-black tracking-tight ${
                      lowStock.length > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
                    }`}
                  >
                    {lowStock.length}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80 mt-1">
                    Low Stock Supplies
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    {lowStock.length > 0 ? "Below minimum threshold" : "All inventories well-stocked"}
                  </p>
                </div>
              </div>

              {/* Card 4: Total Fleet Catalog */}
              <Link
                href="/items"
                className="interactive-card block rounded-2xl border border-border bg-surface p-5 hover:border-brand-yellow/60 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-yellow/20 text-brand-navy dark:text-brand-yellow">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-brand-yellow/20 text-brand-navy dark:text-brand-yellow">
                    Catalog
                  </span>
                </div>
                <div className="mt-4">
                  <p className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
                    {items.length}
                  </p>
                  <p className="text-xs font-semibold text-foreground/80 mt-1">
                    Total Hardware Assets
                  </p>
                  <p className="text-[11px] text-muted mt-0.5">
                    Across {categories.length} equipment categories
                  </p>
                </div>
              </Link>
            </div>

            {/* ─── 2-Column Asymmetric Operations Deck ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (7 cols): Active Custody Stream */}
              <div className="lg:col-span-7 rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-5">
                {/* Section Header with Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <span>Active Equipment Custody</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent font-mono font-semibold">
                        {filteredList.length}
                      </span>
                    </h2>
                    <p className="text-xs text-muted mt-0.5">
                      Assigned devices currently registered to employees
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-surface-elevated p-1 rounded-xl border border-border self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveFilter("all")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        activeFilter === "all"
                          ? "bg-accent text-accent-contrast shadow-xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      All ({checkedOut.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveFilter("overdue")}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                        activeFilter === "overdue"
                          ? "bg-rose-500 text-white shadow-xs"
                          : "text-muted hover:text-foreground"
                      }`}
                    >
                      Overdue ({overdue.length})
                    </button>
                  </div>
                </div>

                {/* Quick Search inside list */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by device, employee name, or email..."
                    className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-background text-foreground placeholder:text-muted focus:outline-hidden focus:border-accent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-2.5 text-xs text-muted hover:text-foreground"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Items List */}
                {filteredList.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-border rounded-xl space-y-3">
                    <div className="mx-auto w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        {activeFilter === "overdue"
                          ? "No Overdue Returns"
                          : "No Devices Found"}
                      </p>
                      <p className="text-xs text-muted max-w-xs mx-auto">
                        {activeFilter === "overdue"
                          ? "All assigned hardware items are well within their scheduled loan periods."
                          : searchQuery
                          ? `No custody records matched "${searchQuery}".`
                          : "No hardware is currently marked as checked out."}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredList.map(({ checkout, item }) => {
                      const assigneeName = checkout.assignedToName || checkout.collectedBy || "Unknown Staff";
                      const initials = assigneeName
                        .split(" ")
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();

                      const isItemOverdue =
                        checkout.dueDate && new Date(checkout.dueDate).getTime() < now;

                      const categoryName = item?.categoryId
                        ? categoryById.get(item.categoryId)?.name
                        : undefined;

                      return (
                        <div
                          key={checkout.id}
                          onClick={() => setSelectedCheckout(checkout)}
                          className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-surface-elevated/60 hover:bg-surface-elevated hover:border-accent/40 cursor-pointer transition-all duration-200"
                        >
                          {/* Left: Avatar + Details */}
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-brand-navy text-brand-yellow font-black text-xs flex items-center justify-center shrink-0 border border-brand-yellow/30 shadow-xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-foreground truncate">
                                  {item?.name || "Equipment Item"}
                                </p>
                                {categoryName && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-background border border-border text-muted">
                                    {categoryName}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted truncate mt-0.5">
                                Assigned to <span className="text-foreground font-medium">{assigneeName}</span>
                                {checkout.assignedToEmail ? ` • ${checkout.assignedToEmail}` : ""}
                              </p>
                            </div>
                          </div>

                          {/* Right: Dates + Status Pill + Arrow */}
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                            <div className="text-left sm:text-right text-[11px]">
                              <p className="text-muted">
                                Out:{" "}
                                <span className="font-mono text-foreground font-medium">
                                  {new Date(checkout.dateCollected).toLocaleDateString()}
                                </span>
                              </p>
                              <p
                                className={`font-mono font-medium ${
                                  isItemOverdue ? "text-rose-600 dark:text-rose-400" : "text-muted"
                                }`}
                              >
                                {checkout.dueDate
                                  ? `Due: ${new Date(checkout.dueDate).toLocaleDateString()}`
                                  : "Permanent Loan"}
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

                            <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Right Column (5 cols): Category Utilization & Fleet Operations Hub */}
              <div className="lg:col-span-5 space-y-6">
                {/* Card 1: Category Capacity Breakdown */}
                <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div>
                      <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                        <Boxes className="w-4 h-4 text-brand-teal" />
                        <span>Category Capacity</span>
                      </h2>
                      <p className="text-xs text-muted mt-0.5">
                        Fleet allocation and stock availability
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab("By category")}
                      className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                    >
                      <span>All</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3.5">
                    {breakdown.slice(0, 6).map(({ category, totalItems, checkedOut, available, lowStock }) => {
                      const deployedPct =
                        totalItems > 0 ? Math.round((checkedOut / totalItems) * 100) : 0;

                      return (
                        <div
                          key={category.id}
                          onClick={() => setSelectedCategory(category)}
                          className="group p-3 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-brand-teal/40 cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-foreground group-hover:text-accent transition-colors">
                              {category.name}
                            </span>
                            <span className="font-mono text-muted text-[11px]">
                              <span className="text-foreground font-semibold">{checkedOut}</span> in use / {totalItems} total
                            </span>
                          </div>

                          {/* Capacity Progress Bar */}
                          <div className="mt-2 w-full h-2 rounded-full bg-background overflow-hidden border border-border/40 flex">
                            <div
                              style={{ width: `${deployedPct}%` }}
                              className="h-full bg-brand-teal dark:bg-teal-400 transition-all duration-500 rounded-l-full"
                              title={`${deployedPct}% deployed`}
                            />
                            {lowStock > 0 && (
                              <div
                                style={{
                                  width: `${Math.round((lowStock / (totalItems || 1)) * 100)}%`,
                                }}
                                className="h-full bg-amber-500 transition-all duration-500"
                                title={`${lowStock} low stock`}
                              />
                            )}
                          </div>

                          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted font-medium">
                            <span>{deployedPct}% deployed</span>
                            <span>{available} available</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Card 2: Operations Quick Hub */}
                <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-bold text-foreground">
                    Quick Operations
                  </h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link
                      href="/checkouts"
                      className="p-3 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-accent/40 transition-colors text-left"
                    >
                      <ClipboardList className="w-4 h-4 text-accent" />
                      <p className="text-xs font-bold text-foreground mt-2">New Loan</p>
                      <p className="text-[10px] text-muted mt-0.5">Issue device to staff</p>
                    </Link>

                    <Link
                      href="/items"
                      className="p-3 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-accent/40 transition-colors text-left"
                    >
                      <Package className="w-4 h-4 text-brand-teal" />
                      <p className="text-xs font-bold text-foreground mt-2">Add Device</p>
                      <p className="text-[10px] text-muted mt-0.5">Register to catalog</p>
                    </Link>

                    <Link
                      href="/staff"
                      className="p-3 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-accent/40 transition-colors text-left"
                    >
                      <Monitor className="w-4 h-4 text-purple-400" />
                      <p className="text-xs font-bold text-foreground mt-2">Staff Portal</p>
                      <p className="text-[10px] text-muted mt-0.5">Self-service & claims</p>
                    </Link>

                    <Link
                      href="/exports"
                      className="p-3 rounded-xl border border-border bg-surface-elevated/40 hover:bg-surface-elevated hover:border-accent/40 transition-colors text-left"
                    >
                      <Sparkles className="w-4 h-4 text-brand-yellow" />
                      <p className="text-xs font-bold text-foreground mt-2">Export Data</p>
                      <p className="text-[10px] text-muted mt-0.5">CSV / Excel reports</p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── TAB 2: BY CATEGORY ─── */}
        {tab === "By category" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">Category Stock Breakdown</h2>
                <p className="text-xs text-muted">Equipment volumes, field deployment, and reorder levels.</p>
              </div>
            </div>

            <Table
              headers={["Category", "Total Items", "Assigned in Field", "Available in Store", "Low Stock Status"]}
              mobileCards={
                <ul className="space-y-3">
                  {breakdown.map(({ category, totalItems, checkedOut, available, lowStock }) => (
                    <li
                      key={category.id}
                      className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
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
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground break-words">
                            {category.name}
                          </p>
                          <p className="text-xs text-muted mt-0.5">
                            {totalItems} total {totalItems === 1 ? "item" : "items"}
                          </p>
                        </div>
                        {lowStock > 0 && (
                          <span className="inline-flex shrink-0 items-center rounded-full bg-status-low-stock-bg px-2.5 py-1 text-xs font-semibold text-status-low-stock">
                            {lowStock} low
                          </span>
                        )}
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                        <MiniStat label="Assigned" value={checkedOut} />
                        <MiniStat label="Available" value={available} />
                        <MiniStat
                          label="Low stock"
                          value={lowStock}
                          tone={lowStock > 0 ? "text-status-low-stock" : "text-muted"}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              }
            >
              {breakdown.map(({ category, totalItems, checkedOut, available, lowStock }) => (
                <tr
                  key={category.id}
                  className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground transition-colors"
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
                    <span className="font-semibold text-foreground">{category.name}</span>
                  </Td>
                  <Td muted mono>{totalItems}</Td>
                  <Td muted mono>{checkedOut}</Td>
                  <Td muted mono>{available}</Td>
                  <td className="px-4 py-3 font-mono">
                    {lowStock > 0 ? (
                      <span className="text-status-low-stock font-bold">{lowStock}</span>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
              <div>
                <h2 className="text-lg font-bold text-foreground">Equipment Loan Audit History</h2>
                <p className="text-xs text-muted">Complete audit trail of all custody transfers and returns.</p>
              </div>

              <div className="flex gap-1 bg-surface-elevated p-1 rounded-xl border border-border">
                <button
                  onClick={() => setHistoryMode("person")}
                  className={`pressable px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    historyMode === "person"
                      ? "bg-accent text-accent-contrast shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  By Person
                </button>
                <button
                  onClick={() => setHistoryMode("item")}
                  className={`pressable px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    historyMode === "item"
                      ? "bg-accent text-accent-contrast shadow-xs"
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted font-medium">Select Staff Member:</span>
                    <select
                      className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-medium focus:outline-hidden focus:border-accent"
                      value={activeSelectedAdmin}
                      onChange={(e) => setSelectedAdmin(e.target.value)}
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
                    headers={["Item", "Assigned Date", "Returned Date", "Processed By", "Condition", "Status"]}
                    mobileCards={
                      <ul className="space-y-3">
                        {personHistory.map((c) => (
                          <li
                            key={c.id}
                            className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout);
                              }
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground break-words">
                                  {itemById.get(c.itemId)?.name ?? "Unknown"}
                                </p>
                                <p className="text-xs text-muted mt-0.5 truncate">
                                  Processed by {c.collectedBy}
                                </p>
                              </div>
                              <div className="shrink-0">
                                <StatusPill
                                  status={
                                    c.status === "returned"
                                      ? "returned"
                                      : c.dueDate && new Date(c.dueDate) < new Date()
                                        ? "overdue"
                                        : "active"
                                  }
                                />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted">Assigned</p>
                                <p className="text-foreground">
                                  {new Date(c.dateCollected).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Returned</p>
                                <p className="text-foreground">
                                  {c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Condition</p>
                                <p className="text-foreground capitalize">
                                  {c.conditionOnReturn ?? c.conditionOnCollection}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    }
                  >
                    {personHistory.map((c) => (
                      <tr
                        key={c.id}
                        className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground transition-colors"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedCheckout({ ...c, itemId: c.itemId } as Checkout);
                          }
                        }}
                      >
                        <Td>{itemById.get(c.itemId)?.name ?? "Unknown"}</Td>
                        <Td muted>{new Date(c.dateCollected).toLocaleDateString()}</Td>
                        <Td muted>{c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}</Td>
                        <Td muted mono>{c.collectedBy}</Td>
                        <Td muted capitalize>{c.conditionOnReturn ?? c.conditionOnCollection}</Td>
                        <td className="px-4 py-3">
                          <StatusPill
                            status={
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate) < new Date()
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
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted font-medium">Select Hardware Item:</span>
                  <select
                    className="px-3 py-1.5 rounded-xl border border-border bg-surface text-foreground text-xs font-medium focus:outline-hidden focus:border-accent"
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
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
                    headers={["Assigned To", "Assigned Date", "Returned Date", "Processed By", "Condition", "Status"]}
                    mobileCards={
                      <ul className="space-y-3">
                        {itemHistory.map((c) => (
                          <li
                            key={c.id}
                            className="interactive-card cursor-pointer rounded-xl border border-border bg-surface p-4"
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
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="font-semibold text-sm text-foreground break-words">
                                  {c.assignedToName || c.collectedBy}
                                </p>
                                <p className="text-xs text-muted mt-0.5 truncate">
                                  Processed by {c.collectedBy}
                                </p>
                              </div>
                              <div className="shrink-0">
                                <StatusPill
                                  status={
                                    c.status === "returned"
                                      ? "returned"
                                      : c.dueDate && new Date(c.dueDate) < new Date()
                                        ? "overdue"
                                        : "active"
                                  }
                                />
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                              <div className="min-w-0">
                                <p className="text-muted">Assigned</p>
                                <p className="text-foreground">
                                  {new Date(c.dateCollected).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Returned</p>
                                <p className="text-foreground">
                                  {c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}
                                </p>
                              </div>
                              <div className="min-w-0">
                                <p className="text-muted">Condition</p>
                                <p className="text-foreground capitalize">
                                  {c.conditionOnReturn ?? c.conditionOnCollection}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    }
                  >
                    {itemHistory.map((c) => (
                      <tr
                        key={c.id}
                        className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground transition-colors"
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
                        <Td>{c.assignedToName || c.collectedBy}</Td>
                        <Td muted>{new Date(c.dateCollected).toLocaleDateString()}</Td>
                        <Td muted>{c.dateReturned ? new Date(c.dateReturned).toLocaleDateString() : "—"}</Td>
                        <Td muted mono>{c.collectedBy}</Td>
                        <Td muted capitalize>{c.conditionOnReturn ?? c.conditionOnCollection}</Td>
                        <td className="px-4 py-3">
                          <StatusPill
                            status={
                              c.status === "returned"
                                ? "returned"
                                : c.dueDate && new Date(c.dueDate) < new Date()
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
      {selectedCheckout && (() => {
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

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          category={categoryById.get(selectedItem.categoryId) ?? null}
          onClose={() => setSelectedItem(null)}
        />
      )}

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

function MiniStat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg bg-surface-elevated border border-border p-2">
      <p className={`text-sm font-bold font-mono ${tone ?? "text-foreground"}`}>{value}</p>
      <p className="text-[10px] text-muted uppercase tracking-wide mt-0.5">{label}</p>
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
      <div className="hidden md:block border border-border rounded-2xl overflow-hidden bg-surface shadow-xs overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated text-left text-xs text-muted uppercase tracking-wider">
              {headers.map((h) => (
                <th key={h} className="px-4 py-3 font-semibold whitespace-nowrap">
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
        mono ? "font-mono text-xs" : ""
      } ${capitalize ? "capitalize" : ""}`}
    >
      {children}
    </td>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="border border-dashed border-border rounded-2xl py-12 text-center bg-surface">
      <p className="text-sm font-medium text-muted">{text}</p>
    </div>
  );
}
