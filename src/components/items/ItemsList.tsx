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
  Tag,
  Hash,
  Boxes,
} from "lucide-react";
import { Item, Category, ItemStatus, ItemCondition, ItemIdentifierType } from "@/types";
import { ItemFormModal } from "./ItemFormModal";
import { ItemDetailsModal } from "./ItemDetailsModal";
import { getItemIdentifierLabel } from "@/lib/items";

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
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete item.");
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Assets
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{kpis.total}</div>
          <p className="mt-1 text-xs text-slate-500">All registered equipment</p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Available Pool
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{kpis.available}</div>
          <p className="mt-1 text-xs text-slate-500">Ready for staff assignment</p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              In Custody
            </span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{kpis.checkedOut}</div>
          <p className="mt-1 text-xs text-slate-500">Checked out by staff</p>
        </div>

        <div className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Low Stock Alerts
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">{kpis.lowStock}</div>
          <p className="mt-1 text-xs text-slate-500">Below threshold</p>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by asset name, serial, category, or notes..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900 placeholder-slate-400 transition-colors"
            />
          </div>

          {/* Quick Actions: Export CSV & New Item */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={exportCSV}
              disabled={filteredItems.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              title="Export filtered items to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Equipment</span>
            </button>
          </div>
        </div>

        {/* Multi-Attribute Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-500 mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span className="font-medium">Filter by:</span>
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="checked-out">Assigned / Checked Out</option>
            <option value="low-stock">Low Stock</option>
          </select>

          {/* Condition Dropdown */}
          <select
            value={conditionFilter}
            onChange={(e) => {
              setConditionFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Conditions</option>
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="damaged">Damaged</option>
          </select>

          {/* Identifier Type Dropdown */}
          <select
            value={identifierTypeFilter}
            onChange={(e) => {
              setIdentifierTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Identifier Types</option>
            <option value="serial-number">Serial Number</option>
            <option value="asset-tag">Asset Tag</option>
            <option value="service-tag">Service Tag</option>
            <option value="imei">IMEI</option>
            <option value="model-number">Model Number</option>
            <option value="other">Other</option>
            <option value="none">Quantity / None</option>
          </select>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/70 border border-rose-200 rounded-md transition-colors ml-auto"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      </div>

      {/* Assets Table Container */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        {filteredItems.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Package className="w-6 h-6" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">No equipment found</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
              No inventory assets matched your selected filter criteria. Try resetting or adjusting your query.
            </p>
            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100/70 rounded-lg transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">Equipment & Model</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Identifier / Serial</th>
                    <th className="py-3.5 px-4">Quantity / Status</th>
                    <th className="py-3.5 px-4">Condition</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {paginatedItems.map((item) => {
                    const category = categoryById.get(item.categoryId);
                    const isQuantityTracked = category?.trackingType === "quantity";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedItem(item)}
                      >
                        {/* Equipment Name */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0">
                              <Laptop className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.name}
                              </div>
                              {item.registeredByStaff && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 mt-0.5">
                                  Staff Self-Registered
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200">
                            {category?.name ?? "Uncategorized"}
                          </span>
                        </td>

                        {/* Identifier */}
                        <td className="py-3.5 px-4">
                          {isQuantityTracked ? (
                            <span className="text-xs text-slate-400 font-mono">Bulk Tracked</span>
                          ) : item.identifierValue || item.serialNumber ? (
                            <div className="font-mono text-xs text-slate-800 bg-slate-100 px-2 py-0.5 rounded inline-block border border-slate-200">
                              {item.identifierValue || item.serialNumber}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">None</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                item.status === "available"
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : item.status === "checked-out"
                                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}
                            >
                              {item.status === "checked-out"
                                ? "Assigned"
                                : item.status.replace("-", " ").toUpperCase()}
                            </span>
                            {item.quantity !== null && (
                              <span className="text-xs font-mono text-slate-600 font-medium">
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
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : item.condition === "good"
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : item.condition === "fair"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
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
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                              title="Inspect Item"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditing(item)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit Item"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setDeleteError(null);
                                setDeleting(item);
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
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

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-100 bg-slate-50/50 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span>
                  Showing{" "}
                  <span className="font-semibold text-slate-900">
                    {(safePage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-semibold text-slate-900">
                    {Math.min(safePage * pageSize, filteredItems.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-slate-900">
                    {filteredItems.length}
                  </span>{" "}
                  equipment records
                </span>

                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="ml-2 px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 text-xs"
                >
                  <option value={10}>10 / page</option>
                  <option value={15}>15 / page</option>
                  <option value={25}>25 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <div className="px-3 py-1.5 font-medium text-slate-700">
                  Page {safePage} of {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center gap-3 text-rose-600 mb-4">
              <div className="p-2 rounded-lg bg-rose-50 border border-rose-100">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Delete Equipment</h3>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete{" "}
              <span className="font-semibold text-slate-900">{deleting.name}</span>?
              This will remove all associated tracking records from inventory.
            </p>

            {deleteError && (
              <div className="mt-3 p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
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
