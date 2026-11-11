"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  RotateCcw,
  Package,
  CheckCircle2,
  Laptop,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  Boxes,
} from "lucide-react";
import { Item, Category } from "@/types";
import { ItemFormModal } from "./ItemFormModal";
import { ItemDetailsModal } from "./ItemDetailsModal";
import { Select } from "@/components/common/Select";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";

interface ItemsListProps {
  items: Item[];
  categories: Category[];
}

const CONDITION_TONE: Record<string, string> = {
  new: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
  good: "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/20",
  fair: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
  damaged: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
};

export function ItemsList({ items, categories }: ItemsListProps) {
  const router = useRouter();

  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [identifierTypeFilter, setIdentifierTypeFilter] = useState<string>("all");

  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [mobileLimit, setMobileLimit] = useState(6);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const category = categoryById.get(item.categoryId);
      const categoryName = category?.name ?? "";

      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) {
        return false;
      }

      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      if (conditionFilter !== "all" && item.condition !== conditionFilter) {
        return false;
      }

      if (identifierTypeFilter !== "all") {
        if (identifierTypeFilter === "none" && item.identifierType !== null) return false;
        if (identifierTypeFilter !== "none" && item.identifierType !== identifierTypeFilter) {
          return false;
        }
      }

      if (normalizedQuery) {
        const matches = [
          item.name,
          categoryName,
          item.serialNumber,
          item.identifierValue,
          item.quantity?.toString(),
          item.status,
          item.condition,
          item.notes,
        ]
          .filter(Boolean)
          .some((val) => val!.toLowerCase().includes(normalizedQuery));

        if (!matches) return false;
      }

      return true;
    });
  }, [items, categoryById, categoryFilter, statusFilter, conditionFilter, identifierTypeFilter, query]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  const kpis = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.status === "available").length;
    const checkedOut = items.filter((i) => i.status === "checked-out").length;
    const lowStock = items.filter((i) => i.status === "low-stock").length;
    return { total, available, checkedOut, lowStock };
  }, [items]);

  const nonQueryFiltersCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (conditionFilter !== "all" ? 1 : 0) +
    (identifierTypeFilter !== "all" ? 1 : 0);

  const activeFiltersCount = nonQueryFiltersCount + (query.trim() ? 1 : 0);

  function resetFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setConditionFilter("all");
    setIdentifierTypeFilter("all");
    setCurrentPage(1);
    setMobileLimit(6);
  }

  function exportCSV() {
    if (filteredItems.length === 0) return;

    const headers = [
      "Asset Name",
      "Category",
      "Identifier Type",
      "Identifier / Serial",
      "Quantity",
      "Status",
      "Condition",
      "Self Registered",
      "Approval Status",
      "Notes",
      "Date Added",
    ];

    const rows = filteredItems.map((item) => {
      const category = categoryById.get(item.categoryId);
      return [
        `"${(item.name || "").replace(/"/g, '""')}"`,
        `"${(category?.name || "Uncategorized").replace(/"/g, '""')}"`,
        `"${item.identifierType || "none"}"`,
        `"${(item.identifierValue || item.serialNumber || "").replace(/"/g, '""')}"`,
        item.quantity !== null ? item.quantity : "N/A",
        `"${item.status}"`,
        `"${item.condition}"`,
        item.registeredByStaff ? "Yes" : "No",
        `"${item.approvalStatus || "approved"}"`,
        `"${(item.notes || "").replace(/"/g, '""')}"`,
        `"${new Date(item.createdAt).toISOString()}"`,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    const dateStr = new Date().toISOString().split("T")[0];
    link.setAttribute("download", `inventory-assets-${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    setDeletingId(deleting.id);

    try {
      const response = await fetch(`/api/items/${deleting.id}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Couldn't delete item.");
      }

      setDeleting(null);
      setDeletingId(null);
      router.refresh();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete item.");
      setDeletingId(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory Catalog"
        description="Company-owned hardware, computing devices, and tracked supplies."
        action={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCSV}
              disabled={filteredItems.length === 0}
              className="pressable inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-foreground bg-surface border border-border/80 hover:bg-surface-elevated rounded-xl transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-muted" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="pressable inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-accent hover:bg-accent-hover rounded-xl transition-colors shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          </div>
        }
      />

      <div className="px-4 md:px-8 pb-6 sm:pb-12 space-y-4 sm:space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="p-3.5 sm:p-5 rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Total Assets</span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-surface-elevated/80 text-muted flex items-center justify-center">
                <Boxes className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.total}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">All registered equipment</p>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Available</span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.available}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">Ready for assignment</p>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Assigned</span>
              <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-accent-soft text-accent flex items-center justify-center">
                <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div className="mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums">
              {kpis.checkedOut}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">Checked out to staff</p>
          </div>

          <div className="p-3.5 sm:p-5 rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-muted">Low Stock</span>
              <div
                className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg flex items-center justify-center ${
                  kpis.lowStock > 0
                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                    : "bg-surface-elevated/80 text-muted"
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>
            <div
              className={`mt-2 sm:mt-3 text-xl sm:text-3xl font-bold tracking-tight tabular-nums ${
                kpis.lowStock > 0 ? "text-amber-600 dark:text-amber-400" : "text-foreground"
              }`}
            >
              {kpis.lowStock}
            </div>
            <p className="hidden sm:block mt-1 text-xs text-muted">Below minimum threshold</p>
          </div>
        </div>

        {/* Unified Catalog Table Card */}
        <div className="bg-surface border border-border/70 rounded-2xl overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          {/* Search & Filter Toolbar */}
          <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-border/60 space-y-2.5 sm:space-y-3">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setCurrentPage(1);
                      setMobileLimit(6);
                    }}
                    placeholder="Search asset, serial, category..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs bg-background border border-border/80 rounded-xl focus:outline-none focus:border-accent text-foreground placeholder:text-muted transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters((v) => !v)}
                  className={`md:hidden shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${
                    showMobileFilters || nonQueryFiltersCount > 0
                      ? "bg-accent-soft text-accent border-accent/30"
                      : "bg-background text-muted border-border/80 hover:text-foreground"
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filters{nonQueryFiltersCount > 0 ? ` (${nonQueryFiltersCount})` : ""}</span>
                </button>
              </div>

              <div
                className={`${
                  showMobileFilters ? "grid grid-cols-2" : "hidden"
                } md:flex md:flex-wrap items-center gap-2`}
              >
                <div className="w-full md:w-44">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                      setMobileLimit(6);
                    }}
                    triggerClassName="py-1.5 px-2.5 text-xs bg-background border-border/80 rounded-xl"
                    options={[
                      { value: "all", label: `All Categories (${categories.length})` },
                      ...categories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </div>

                <div className="w-full md:w-36">
                  <Select
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                      setMobileLimit(6);
                    }}
                    triggerClassName="py-1.5 px-2.5 text-xs bg-background border-border/80 rounded-xl"
                    options={[
                      { value: "all", label: "All Statuses" },
                      { value: "available", label: "Available" },
                      { value: "checked-out", label: "Assigned" },
                      { value: "low-stock", label: "Low Stock" },
                    ]}
                  />
                </div>

                <div className="w-full md:w-36">
                  <Select
                    value={conditionFilter}
                    onChange={(e) => {
                      setConditionFilter(e.target.value);
                      setCurrentPage(1);
                      setMobileLimit(6);
                    }}
                    triggerClassName="py-1.5 px-2.5 text-xs bg-background border-border/80 rounded-xl"
                    options={[
                      { value: "all", label: "All Conditions" },
                      { value: "new", label: "New" },
                      { value: "good", label: "Good" },
                      { value: "fair", label: "Fair" },
                      { value: "damaged", label: "Damaged" },
                    ]}
                  />
                </div>

                <div className="w-full md:w-40">
                  <Select
                    value={identifierTypeFilter}
                    onChange={(e) => {
                      setIdentifierTypeFilter(e.target.value);
                      setCurrentPage(1);
                      setMobileLimit(6);
                    }}
                    triggerClassName="py-1.5 px-2.5 text-xs bg-background border-border/80 rounded-xl"
                    options={[
                      { value: "all", label: "All Identifiers" },
                      { value: "serial-number", label: "Serial Number" },
                      { value: "asset-tag", label: "Asset Tag" },
                      { value: "service-tag", label: "Service Tag" },
                      { value: "imei", label: "IMEI" },
                      { value: "model-number", label: "Model Number" },
                      { value: "other", label: "Other" },
                      { value: "none", label: "Quantity / None" },
                    ]}
                  />
                </div>

                {activeFiltersCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="col-span-2 md:col-span-1 justify-center inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-border/80 rounded-xl transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset ({activeFiltersCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {filteredItems.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-11 h-11 rounded-full bg-surface-elevated border border-border/60 flex items-center justify-center mx-auto text-muted">
                <Package className="w-5 h-5" />
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">No equipment found</h3>
              <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                No inventory assets matched your current filters.
              </p>
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent-soft rounded-xl transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-surface-elevated/40 border-b border-border/60 text-xs font-medium text-muted">
                      <th className="py-3 px-5 font-medium">Equipment</th>
                      <th className="py-3 px-4 font-medium">Category</th>
                      <th className="py-3 px-4 font-medium">Identifier / Serial</th>
                      <th className="py-3 px-4 font-medium">Status</th>
                      <th className="py-3 px-4 font-medium">Condition</th>
                      <th className="py-3 px-5 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 text-sm">
                    {paginatedItems.map((item) => {
                      const category = categoryById.get(item.categoryId);
                      const isQuantityTracked = category?.trackingType === "quantity";
                      const normalizedStatus =
                        item.status === "checked-out"
                          ? "checked-out"
                          : item.status === "low-stock"
                          ? "low-stock"
                          : "available";

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-surface-elevated/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedItem(item)}
                        >
                          <td className="py-3.5 px-5">
                            <div className="font-medium text-foreground group-hover:text-accent transition-colors">
                              {item.name}
                            </div>
                            {item.registeredByStaff && (
                              <div className="text-[11px] text-muted mt-0.5">
                                Staff self-registered
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-xs text-muted">
                            {category?.name ?? "Uncategorized"}
                          </td>

                          <td className="py-3.5 px-4">
                            {isQuantityTracked ? (
                              <span className="text-xs text-muted font-mono">Bulk tracked</span>
                            ) : item.identifierValue || item.serialNumber ? (
                              <span className="font-mono text-xs text-foreground">
                                {item.identifierValue || item.serialNumber}
                              </span>
                            ) : (
                              <span className="text-xs text-muted">—</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <StatusPill status={normalizedStatus} />
                              {item.quantity !== null && (
                                <span className="text-xs text-muted tabular-nums">
                                  ({item.quantity} in stock)
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${
                                CONDITION_TONE[item.condition] ??
                                "bg-surface-elevated text-muted border-border/60"
                              }`}
                            >
                              {item.condition}
                            </span>
                          </td>

                          <td
                            className="py-3.5 px-5 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setSelectedItem(item)}
                                className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
                                title="Inspect Item"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditing(item)}
                                className="p-1.5 text-muted hover:text-accent hover:bg-accent-soft rounded-lg transition-colors"
                                title="Edit Item"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setDeleteError(null);
                                  setDeleting(item);
                                }}
                                className="p-1.5 text-muted hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
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
                  {paginatedItems.slice(0, mobileLimit).map((item) => {
                    const category = categoryById.get(item.categoryId);
                    const isQuantityTracked = category?.trackingType === "quantity";
                    const normalizedStatus =
                      item.status === "checked-out"
                        ? "checked-out"
                        : item.status === "low-stock"
                        ? "low-stock"
                        : "available";

                    return (
                      <div
                        key={item.id}
                        className="px-3.5 py-2.5 bg-surface active:bg-surface-elevated/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        <div className="flex items-center justify-between gap-2.5">
                          <h4 className="font-medium text-foreground text-sm truncate min-w-0">
                            {item.name}
                          </h4>
                          <div className="shrink-0">
                            <StatusPill status={normalizedStatus} />
                          </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs text-muted min-w-0 truncate">
                            <span className="truncate">{category?.name ?? "Uncategorized"}</span>
                            <span>·</span>
                            {isQuantityTracked ? (
                              <span className="font-mono shrink-0">Bulk</span>
                            ) : item.identifierValue || item.serialNumber ? (
                              <span className="font-mono text-foreground truncate">
                                {item.identifierValue || item.serialNumber}
                              </span>
                            ) : (
                              <span className="capitalize shrink-0">{item.condition}</span>
                            )}
                            {item.quantity !== null && (
                              <span className="tabular-nums shrink-0">· {item.quantity}</span>
                            )}
                          </div>

                          <div
                            className="flex items-center gap-1 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => setEditing(item)}
                              aria-label={`Edit ${item.name}`}
                              className="p-1.5 text-accent hover:bg-accent-soft rounded-lg transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeleting(item);
                              }}
                              aria-label={`Delete ${item.name}`}
                              className="p-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <ShowMoreBar
                  visibleCount={Math.min(mobileLimit, paginatedItems.length)}
                  totalCount={paginatedItems.length}
                  initialLimit={6}
                  noun="items on page"
                  onShowMore={() => setMobileLimit((prev) => prev + 6)}
                  onCollapse={() => setMobileLimit(6)}
                />
              </div>

              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-5 py-3 sm:py-3.5 border-t border-border/50 bg-surface-elevated/20 text-xs text-muted">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="tabular-nums">
                    Showing{" "}
                    <span className="font-medium text-foreground">
                      {(safePage - 1) * pageSize + 1}
                    </span>
                    –
                    <span className="font-medium text-foreground">
                      {Math.min(safePage * pageSize, filteredItems.length)}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-foreground">{filteredItems.length}</span>{" "}
                    assets
                  </span>

                  <div className="w-28 ml-1">
                    <Select
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1);
                        setMobileLimit(6);
                      }}
                      triggerClassName="py-1 px-2 text-xs rounded-lg border-border/80 bg-surface"
                      options={[
                        { value: "10", label: "10 / page" },
                        { value: "15", label: "15 / page" },
                        { value: "25", label: "25 / page" },
                        { value: "50", label: "50 / page" },
                      ]}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(1, p - 1));
                      setMobileLimit(6);
                    }}
                    disabled={safePage <= 1}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-border/80 rounded-lg text-foreground hover:bg-surface-elevated disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Previous</span>
                  </button>

                  <span className="px-2.5 py-1.5 font-medium text-foreground tabular-nums">
                    {safePage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.min(totalPages, p + 1));
                      setMobileLimit(6);
                    }}
                    disabled={safePage >= totalPages}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-border/80 rounded-lg text-foreground hover:bg-surface-elevated disabled:opacity-40 transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <ItemFormModal
          categories={categories}
          defaultCategoryId={categoryFilter !== "all" ? categoryFilter : undefined}
          onClose={() => setShowCreate(false)}
        />
      )}

      {editing && (
        <ItemFormModal
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
        />
      )}

      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          category={categoryById.get(selectedItem.categoryId) ?? null}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-xl border border-border/70 animate-scale-up">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-foreground">Delete Equipment</h3>
            </div>

            <p className="text-sm text-muted">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{deleting.name}</span>? This will
              remove its inventory record.
            </p>

            {deleteError && (
              <div className="mt-3 p-3 text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-border/60">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="px-4 py-2 text-xs font-medium text-foreground bg-surface border border-border/80 rounded-xl hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === deleting.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs disabled:opacity-50"
              >
                {deletingId === deleting.id ? "Deleting..." : "Delete Equipment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
