"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Download,
  Filter,
  RotateCcw,
  Package,
  CheckCircle2,
  Laptop,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Eye,
  Boxes,
} from "lucide-react";
import { Item, Category } from "@/types";
import { ItemFormModal } from "./ItemFormModal";
import { ItemDetailsModal } from "./ItemDetailsModal";
import { Select } from "@/components/common/Select";

interface ItemsListProps {
  items: Item[];
  categories: Category[];
}

export function ItemsList({ items, categories }: ItemsListProps) {
  const router = useRouter();

  // Filters state
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [conditionFilter, setConditionFilter] = useState<string>("all");
  const [identifierTypeFilter, setIdentifierTypeFilter] = useState<string>("all");

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  // Filter items
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const category = categoryById.get(item.categoryId);
      const categoryName = category?.name ?? "";

      // Category filter
      if (categoryFilter !== "all" && item.categoryId !== categoryFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && item.status !== statusFilter) {
        return false;
      }

      // Condition filter
      if (conditionFilter !== "all" && item.condition !== conditionFilter) {
        return false;
      }

      // Identifier type filter
      if (identifierTypeFilter !== "all") {
        if (identifierTypeFilter === "none" && item.identifierType !== null) return false;
        if (identifierTypeFilter !== "none" && item.identifierType !== identifierTypeFilter) return false;
      }

      // Search query
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
  }, [items, categories, categoryById, categoryFilter, statusFilter, conditionFilter, identifierTypeFilter, query]);

  // Reset page when filters change
  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;
  const safePage = Math.min(currentPage, totalPages);

  const paginatedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, safePage, pageSize]);

  // KPI calculations
  const kpis = useMemo(() => {
    const total = items.length;
    const available = items.filter((i) => i.status === "available").length;
    const checkedOut = items.filter((i) => i.status === "checked-out").length;
    const lowStock = items.filter((i) => i.status === "low-stock").length;
    return { total, available, checkedOut, lowStock };
  }, [items]);

  const activeFiltersCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (conditionFilter !== "all" ? 1 : 0) +
    (identifierTypeFilter !== "all" ? 1 : 0) +
    (query.trim() ? 1 : 0);

  function resetFilters() {
    setQuery("");
    setCategoryFilter("all");
    setStatusFilter("all");
    setConditionFilter("all");
    setIdentifierTypeFilter("all");
    setCurrentPage(1);
  }

  // Quick CSV Export
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

  // Delete handler
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
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Total Assets
            </span>
            <div className="p-2.5 rounded-xl bg-brand-teal/15 text-brand-teal">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{kpis.total}</div>
          <p className="mt-1 text-xs text-muted">All registered equipment</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Available Pool
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{kpis.available}</div>
          <p className="mt-1 text-xs text-muted">Ready for staff assignment</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              In Custody
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{kpis.checkedOut}</div>
          <p className="mt-1 text-xs text-muted">Checked out by staff</p>
        </div>

        <div className="p-5 rounded-2xl border border-border bg-surface shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Low Stock Alerts
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-black text-foreground">{kpis.lowStock}</div>
          <p className="mt-1 text-xs text-muted">Below threshold</p>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-surface p-4 rounded-2xl border border-border shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by asset name, serial, category, or notes..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-surface-elevated border border-border rounded-xl focus:outline-none focus:border-brand-teal text-foreground placeholder:text-muted transition-colors"
            />
          </div>

          {/* Quick Actions: Export CSV & New Item */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={exportCSV}
              disabled={filteredItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-foreground bg-surface border border-border hover:bg-surface-elevated rounded-xl transition-colors shadow-xs disabled:opacity-50"
              title="Export filtered items to CSV"
            >
              <Download className="w-3.5 h-3.5 text-brand-teal" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-brand-navy bg-brand-yellow hover:bg-brand-yellow/90 rounded-xl transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          </div>
        </div>

        {/* Multi-Attribute Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border">
          <div className="flex items-center gap-1 text-xs text-muted mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-semibold">Filter by:</span>
          </div>

          {/* Category Dropdown */}
          <div className="w-48">
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              triggerClassName="py-1 px-2.5 text-xs bg-surface-elevated rounded-lg"
              options={[
                { value: "all", label: `All Categories (${categories.length})` },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              triggerClassName="py-1 px-2.5 text-xs bg-surface-elevated rounded-lg"
              options={[
                { value: "all", label: "All Statuses" },
                { value: "available", label: "Available" },
                { value: "checked-out", label: "Assigned" },
                { value: "low-stock", label: "Low Stock" },
              ]}
            />
          </div>

          {/* Condition Dropdown */}
          <div className="w-36">
            <Select
              value={conditionFilter}
              onChange={(e) => {
                setConditionFilter(e.target.value);
                setCurrentPage(1);
              }}
              triggerClassName="py-1 px-2.5 text-xs bg-surface-elevated rounded-lg"
              options={[
                { value: "all", label: "All Conditions" },
                { value: "new", label: "New" },
                { value: "good", label: "Good" },
                { value: "fair", label: "Fair" },
                { value: "damaged", label: "Damaged" },
              ]}
            />
          </div>

          {/* Identifier Type Dropdown */}
          <div className="w-44">
            <Select
              value={identifierTypeFilter}
              onChange={(e) => {
                setIdentifierTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              triggerClassName="py-1 px-2.5 text-xs bg-surface-elevated rounded-lg"
              options={[
                { value: "all", label: "All Identifier Types" },
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

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 rounded-lg transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Assets Table Container */}
      <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xs">
        {filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center mx-auto text-muted">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-foreground">No equipment found</h3>
            <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
              No inventory assets matched your selected filter criteria. Try resetting or adjusting your query.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-teal hover:text-brand-teal/80 bg-brand-teal/10 hover:bg-brand-teal/20 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-elevated/70 border-b border-border text-xs font-semibold text-muted uppercase tracking-wider">
                    <th className="py-3.5 px-4">Equipment & Model</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Identifier / Serial</th>
                    <th className="py-3.5 px-4">Quantity / Status</th>
                    <th className="py-3.5 px-4">Condition</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {paginatedItems.map((item) => {
                    const category = categoryById.get(item.categoryId);
                    const isQuantityTracked = category?.trackingType === "quantity";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-elevated/50 transition-colors group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Equipment Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal flex-shrink-0">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground group-hover:text-brand-teal transition-colors">
                                {item.name}
                              </div>
                              {item.registeredByStaff && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-purple-400 bg-purple-500/10 px-1.5 py-0.2 rounded border border-purple-500/20 mt-0.5">
                                  Staff Self-Registered
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-foreground bg-surface-elevated border border-border">
                            {category?.name ?? "Uncategorized"}
                          </span>
                        </td>

                        {/* Identifier */}
                        <td className="py-3.5 px-4">
                          {isQuantityTracked ? (
                            <span className="text-xs text-muted font-mono">Bulk Tracked</span>
                          ) : item.identifierValue || item.serialNumber ? (
                            <div className="font-mono text-xs text-foreground bg-surface-elevated px-2 py-0.5 rounded inline-block border border-border">
                              {item.identifierValue || item.serialNumber}
                            </div>
                          ) : (
                            <span className="text-xs text-muted">None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.status === "available"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : item.status === "checked-out"
                                  ? "bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {item.status === "checked-out"
                                ? "Assigned"
                                : item.status.replace("-", " ").toUpperCase()}
                            </span>
                            {item.quantity !== null && (
                              <span className="text-xs font-mono text-muted font-medium">
                                ({item.quantity} in stock)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Condition */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
                              item.condition === "new"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : item.condition === "good"
                                ? "bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
                                : item.condition === "fair"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            {item.condition}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3.5 px-4 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedItem(item)}
                              className="p-1.5 text-muted hover:text-foreground hover:bg-surface-elevated rounded-lg transition-colors"
                              title="Inspect Item"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditing(item)}
                              className="p-1.5 text-muted hover:text-brand-teal hover:bg-brand-teal/10 rounded-lg transition-colors"
                              title="Edit Item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setDeleting(item);
                              }}
                              className="p-1.5 text-muted hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
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

            {/* Mobile Card Stack */}
            <div className="md:hidden divide-y divide-border">
              {paginatedItems.map((item) => {
                const category = categoryById.get(item.categoryId);
                const isQuantityTracked = category?.trackingType === "quantity";

                return (
                  <div
                    key={item.id}
                    className="p-4 space-y-3 bg-surface active:bg-surface-elevated transition-colors cursor-pointer"
                    onClick={() => setSelectedItem(item)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal shrink-0">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">
                            {item.name}
                          </h4>
                          <span className="inline-flex items-center text-[11px] text-muted">
                            {category?.name ?? "Uncategorized"}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize shrink-0 ${
                          item.status === "available"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : item.status === "checked-out"
                            ? "bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {item.status === "checked-out" ? "Assigned" : item.status.replace("-", " ")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 text-xs">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isQuantityTracked ? (
                          <span className="font-mono text-[11px] text-muted">
                            Bulk Tracked
                          </span>
                        ) : item.identifierValue || item.serialNumber ? (
                          <span className="font-mono text-[11px] bg-surface-elevated text-foreground px-2 py-0.5 rounded border border-border">
                            {item.identifierValue || item.serialNumber}
                          </span>
                        ) : null}

                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                            item.condition === "new"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : item.condition === "good"
                              ? "bg-brand-teal/10 text-brand-teal border border-brand-teal/20"
                              : item.condition === "fair"
                              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}
                        >
                          {item.condition}
                        </span>
                      </div>

                      {item.quantity !== null && (
                        <span className="font-mono text-xs text-muted">
                          Qty: {item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Mobile Card Action Bar */}
                    <div
                      className="flex items-center justify-end gap-1 pt-2 border-t border-border"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground hover:bg-surface-elevated rounded-md transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => setEditing(item)}
                        className="px-2.5 py-1 text-xs font-medium text-brand-teal hover:bg-brand-teal/10 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => {
                          setDeleteError(null);
                          setDeleting(item);
                        }}
                        className="px-2.5 py-1 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-border bg-surface-elevated/40 text-xs text-muted">
              <div className="flex items-center gap-2">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-foreground">
                    {(safePage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-foreground">
                    {Math.min(safePage * pageSize, filteredItems.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-foreground">
                    {filteredItems.length}
                  </span>{" "}
                  equipment records
                </span>

                <div className="w-28 ml-2">
                  <Select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    triggerClassName="py-0.5 px-2 text-xs rounded-lg"
                    options={[
                      { value: "10", label: "10 / page" },
                      { value: "15", label: "15 / page" },
                      { value: "25", label: "25 / page" },
                      { value: "50", label: "50 / page" },
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground hover:bg-surface-elevated disabled:opacity-40 transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3 py-1.5 font-medium text-foreground">
                  Page {safePage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface border border-border rounded-lg text-foreground hover:bg-surface-elevated disabled:opacity-40 transition-colors shadow-2xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-2xl max-w-md w-full p-6 shadow-2xl border border-border animate-scale-up">
            <div className="flex items-center gap-3 text-rose-500 mb-4">
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-foreground">Delete Equipment</h3>
            </div>

            <p className="text-sm text-muted">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-foreground">{deleting.name}</span>?
              This will remove all associated tracking records from inventory.
            </p>

            {deleteError && (
              <div className="mt-3 p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === deleting.id}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
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
