"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { Item, Category } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ItemFormModal } from "./ItemFormModal";
import { getItemIdentifierLabel } from "@/lib/items";

export function ItemsList({
  items,
  categories,
}: {
  items: Item[];
  categories: Category[];
}) {
  const router = useRouter();
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      const categoryName = categoryById.get(item.categoryId)?.name ?? "";
      const matchesCategory =
        categoryFilter === "all" || item.categoryId === categoryFilter;
      const matchesQuery =
        !normalizedQuery ||
        [
          item.name,
          categoryName,
          item.identifierValue,
          item.serialNumber,
          item.quantity?.toString(),
          item.status,
          item.condition,
          item.notes,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));

      return matchesCategory && matchesQuery;
    });
  }, [categoryById, categoryFilter, items, query]);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    setDeletingId(deleting.id);

    const response = await fetch(`/api/items/${deleting.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setDeleteError(data?.error ?? "Couldn't delete item.");
      setDeletingId(null);
      return;
    }

    setDeleting(null);
    setDeletingId(null);
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Items"
        description="Every piece of equipment and supply the company owns"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="pressable flex items-center justify-center gap-1.5 p-2.5 sm:px-3.5 sm:py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
            aria-label="New item"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New item</span>
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        <div className="mb-4 flex flex-col sm:flex-row gap-2">
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search inventory"
            />
          </div>
          <select
            className="px-3 py-1.5 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {filteredItems.length === 0 ? (
          <div className="animate-enter border border-dashed border-border rounded-xl py-16 text-center">
            <p className="text-sm text-muted">No items found.</p>
          </div>
        ) : (
          <div className="interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Identifier / Qty</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id} className="table-row border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted">
                      {categoryById.get(item.categoryId)?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted font-mono text-xs">
                      {item.quantity !== null
                        ? `${item.quantity} units`
                        : getItemIdentifierLabel(item)}
                    </td>
                    <td className="px-4 py-3 text-muted capitalize">{item.condition}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={item.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => setEditing(item)}
                          className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setDeleteError(null);
                            setDeleting(item);
                          }}
                          className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-status-overdue"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <ItemFormModal
          categories={categories}
          defaultCategoryId={categoryFilter !== "all" ? categoryFilter : undefined}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <ItemFormModal item={editing} categories={categories} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="modal-panel bg-surface rounded-2xl border border-border max-w-sm w-full p-5">
            <h2 className="font-semibold text-sm mb-1.5">Delete item</h2>
            <p className="text-sm text-muted mb-4">
              This deletes &ldquo;{deleting.name}&rdquo; and its checkout history. This can&apos;t be undone.
            </p>
            {deleteError && (
              <p className="text-sm text-status-overdue mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setDeleting(null);
                  setDeleteError(null);
                }}
                className="pressable flex-1 py-2 rounded-lg border border-border text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingId === deleting.id}
                className="pressable flex-1 py-2 rounded-lg bg-status-overdue text-white text-sm font-medium disabled:opacity-50"
              >
                {deletingId === deleting.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
