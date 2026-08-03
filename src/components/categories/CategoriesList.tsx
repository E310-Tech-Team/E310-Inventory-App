"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Category, Item } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryFormModal } from "./CategoryFormModal";
import { CategoryDetailsModal } from "./CategoryDetailsModal";

export function CategoriesList({
  categories,
  items,
}: {
  categories: Category[];
  items: Item[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteError(null);
    setDeletingId(deleting.id);

    const response = await fetch(`/api/categories/${deleting.id}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json().catch(() => null);
      setDeleteError(data?.error ?? "Couldn't delete category.");
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
        title="Categories"
        description="Define how each type of item is tracked"
        action={
          <button
            onClick={() => setShowCreate(true)}
            className="pressable flex items-center justify-center gap-1.5 p-2.5 sm:px-3.5 sm:py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
            aria-label="New category"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New category</span>
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        {categories.length === 0 ? (
          <div className="animate-enter border border-dashed border-border rounded-xl py-16 text-center">
            <p className="text-sm text-muted">No categories yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Tracking</th>
                  <th className="px-4 py-3 font-medium">Return</th>
                  <th className="px-4 py-3 font-medium">Created by</th>
                  <th className="px-4 py-3 font-medium w-20"></th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => {
                  const itemCount = items.filter((item) => item.categoryId === category.id).length;

                  return (
                  <tr
                    key={category.id}
                    className="table-row cursor-pointer border-b border-border last:border-0 hover:bg-accent-soft/70 text-foreground"
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
                    <td className="px-4 py-3 font-medium">{category.name}</td>
                    <td className="px-4 py-3 text-muted font-mono text-xs">
                      {itemCount}
                    </td>
                    <td className="px-4 py-3 text-muted capitalize">
                      {category.trackingType}
                    </td>
                    <td className="px-4 py-3 text-muted capitalize">
                      {category.returnType.replace("-", " ")}
                    </td>
                    <td className="px-4 py-3 text-muted font-mono text-xs">
                      {category.createdBy}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setEditing(category);
                          }}
                          className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-foreground"
                          aria-label="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            setDeleteError(null);
                            setDeleting(category);
                          }}
                          className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-status-overdue"
                          aria-label="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCategory && (
        <CategoryDetailsModal
          category={selectedCategory}
          itemCount={items.filter((item) => item.categoryId === selectedCategory.id).length}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {showCreate && <CategoryFormModal onClose={() => setShowCreate(false)} />}
      {editing && (
        <CategoryFormModal category={editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="modal-panel bg-surface rounded-2xl border border-border max-w-sm w-full p-5">
            <h2 className="font-semibold text-sm mb-1.5">Delete category</h2>
            <p className="text-sm text-muted mb-4">
              This deletes &ldquo;{deleting.name}&rdquo; and all items in it, including their checkout history. This can&apos;t be undone.
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
