"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Category, Item } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";
import { CategoryFormModal } from "./CategoryFormModal";

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
  const [deleting, setDeleting] = useState<Category | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mobileLimit, setMobileLimit] = useState(8);

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
        description="Define how each type of equipment or supply is tracked"
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="pressable inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-2xs transition-colors"
            aria-label="New category"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New category</span>
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-6 sm:pb-12 animate-enter">
        {categories.length === 0 ? (
          <div className="animate-enter border border-border/70 bg-surface rounded-2xl py-16 text-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <p className="text-sm text-muted">No categories yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-0">
            {/* Mobile: compact hairline list */}
            <div className="md:hidden rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <ul className="divide-y divide-border/50">
                {categories.slice(0, mobileLimit).map((category) => {
                  const itemCount = items.filter((item) => item.categoryId === category.id).length;

                  return (
                    <li
                      key={category.id}
                      className="cursor-pointer px-3.5 py-2.5 hover:bg-surface-elevated/40 transition-colors"
                      role="button"
                      tabIndex={0}
                      onClick={() => router.push(`/categories/${category.id}`)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/categories/${category.id}`);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <p className="font-semibold text-sm text-foreground truncate min-w-0">
                          {category.name}
                        </p>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-foreground bg-surface-elevated px-2 py-0.5 rounded-full">
                          {itemCount} {itemCount === 1 ? "item" : "items"}
                        </span>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted truncate capitalize">
                          {category.trackingType} · {category.returnType.replace("-", " ")}
                          {category.createdBy ? ` · ${category.createdBy}` : ""}
                        </p>

                        <div
                          className="flex items-center gap-0.5 shrink-0"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setEditing(category)}
                            className="pressable p-1.5 rounded-lg hover:bg-surface-elevated text-muted hover:text-foreground transition-colors"
                            aria-label="Edit"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(category);
                            }}
                            className="pressable p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            aria-label="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <ShowMoreBar
                visibleCount={Math.min(mobileLimit, categories.length)}
                totalCount={categories.length}
                initialLimit={8}
                noun="categories"
                onShowMore={() => setMobileLimit((prev) => prev + 8)}
                onCollapse={() => setMobileLimit(8)}
              />
            </div>

            {/* Desktop: full table */}
            <div className="hidden md:block border border-border/70 rounded-2xl overflow-hidden bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-surface-elevated/40 text-left text-xs font-medium text-muted">
                    <th className="px-5 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Tracking</th>
                    <th className="px-4 py-3 font-medium">Return</th>
                    <th className="px-4 py-3 font-medium">Created by</th>
                    <th className="px-5 py-3 font-medium w-24 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {categories.map((category) => {
                    const itemCount = items.filter((item) => item.categoryId === category.id).length;

                    return (
                      <tr
                        key={category.id}
                        className="cursor-pointer hover:bg-surface-elevated/40 text-foreground transition-colors"
                        role="button"
                        tabIndex={0}
                        onClick={() => router.push(`/categories/${category.id}`)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            router.push(`/categories/${category.id}`);
                          }
                        }}
                      >
                        <td className="px-5 py-3.5 font-medium">{category.name}</td>
                        <td className="px-4 py-3.5 text-muted tabular-nums text-xs font-mono">
                          {itemCount}
                        </td>
                        <td className="px-4 py-3.5 text-muted capitalize">
                          {category.trackingType}
                        </td>
                        <td className="px-4 py-3.5 text-muted capitalize">
                          {category.returnType.replace("-", " ")}
                        </td>
                        <td className="px-4 py-3.5 text-muted text-xs">
                          {category.createdBy}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditing(category);
                              }}
                              className="pressable p-1.5 rounded-lg hover:bg-surface-elevated text-muted hover:text-foreground transition-colors"
                              aria-label="Edit"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteError(null);
                                setDeleting(category);
                              }}
                              className="pressable p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
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
          </div>
        )}
      </div>

      {showCreate && <CategoryFormModal onClose={() => setShowCreate(false)} />}
      {editing && (
        <CategoryFormModal category={editing} onClose={() => setEditing(null)} />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div className="modal-panel bg-surface rounded-2xl border border-border/70 max-w-sm w-full p-5 shadow-xl">
            <h2 className="font-semibold text-sm mb-1.5">Delete category</h2>
            <p className="text-sm text-muted mb-4">
              This deletes &ldquo;{deleting.name}&rdquo; and all items in it, including their checkout history. This can&apos;t be undone.
            </p>
            {deleteError && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mb-3">{deleteError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleting(null);
                  setDeleteError(null);
                }}
                className="pressable flex-1 py-2 rounded-xl border border-border/80 text-xs font-medium hover:bg-surface-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deletingId === deleting.id}
                className="pressable flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50"
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
