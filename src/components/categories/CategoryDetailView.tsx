"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { Category, Checkout, DepartmentUser, Item } from "@/types";
import { getEffectiveStatus } from "@/lib/checkout-status";
import { getItemIdentifierLabel } from "@/lib/items";
import { CheckoutModal } from "@/components/checkouts/CheckoutModal";
import { ItemFormModal } from "@/components/items/ItemFormModal";
import { ItemDetailsModal } from "@/components/items/ItemDetailsModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";

export function CategoryDetailView({
  category,
  items,
  checkouts,
  assigners,
  currentAdmin,
}: {
  category: Category;
  items: Item[];
  checkouts: Checkout[];
  assigners: DepartmentUser[];
  currentAdmin: DepartmentUser;
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [assigning, setAssigning] = useState<Item | null>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [mobileLimit, setMobileLimit] = useState(6);

  const activeCheckoutsByItemId = useMemo(() => {
    const map = new Map<string, Checkout[]>();
    checkouts.forEach((checkout) => {
      if (getEffectiveStatus(checkout) === "returned") return;
      const current = map.get(checkout.itemId) ?? [];
      map.set(checkout.itemId, [...current, checkout]);
    });
    return map;
  }, [checkouts]);

  const stats = useMemo(
    () => ({
      total: items.length,
      available: items.filter((item) => item.status === "available").length,
      assigned: items.filter((item) => item.status === "checked-out").length,
      lowStock: items.filter((item) => item.status === "low-stock").length,
    }),
    [items]
  );

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
        title={category.name}
        description={`${category.trackingType} tracking, ${category.returnType.replace(
          "-",
          " "
        )} returns`}
        action={
          <button
            type="button"
            onClick={() => setShowCreate(true)}
            className="pressable inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-2xs transition-colors"
            aria-label="New item"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New item</span>
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-6 sm:pb-12 animate-enter">
        <Link
          href="/categories"
          className="pressable inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground mb-3 sm:mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Categories
        </Link>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
          <MiniStat label="Total" value={stats.total} />
          <MiniStat label="Available" value={stats.available} />
          <MiniStat label="Assigned" value={stats.assigned} />
          <MiniStat label="Low stock" value={stats.lowStock} warning={stats.lowStock > 0} />
        </div>

        {items.length === 0 ? (
          <div className="animate-enter border border-border/70 bg-surface rounded-2xl py-14 text-center shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <p className="text-sm text-muted mb-4">No items recorded in this category yet.</p>
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="pressable inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-white text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New item
            </button>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-0">
            {/* Mobile: compact hairline list */}
            <div className="md:hidden rounded-2xl border border-border/70 bg-surface overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
              <ul className="divide-y divide-border/50">
                {items.slice(0, mobileLimit).map((item) => {
                  const activeCheckouts = activeCheckoutsByItemId.get(item.id) ?? [];
                  const primaryAssignment = activeCheckouts[0];
                  const canAssign =
                    item.status !== "checked-out" && (item.quantity === null || item.quantity > 0);

                  return (
                    <li
                      key={item.id}
                      className="cursor-pointer px-3.5 py-2.5 hover:bg-surface-elevated/40 transition-colors"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedItem(item)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedItem(item);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2.5">
                        <p className="font-semibold text-sm text-foreground truncate min-w-0">
                          {item.name}
                        </p>
                        <div className="shrink-0">
                          <StatusPill status={item.status} />
                        </div>
                      </div>

                      <div className="mt-1 flex items-center justify-between gap-2">
                        <p className="text-xs text-muted truncate min-w-0">
                          <span className="font-mono text-foreground">
                            {item.quantity !== null
                              ? `${item.quantity} units`
                              : getItemIdentifierLabel(item)}
                          </span>
                          {" · "}
                          <span className="capitalize">{item.condition}</span>
                          {primaryAssignment ? (
                            <>
                              {" · "}
                              <span className="text-foreground">
                                {primaryAssignment.assignedToName}
                                {activeCheckouts.length > 1
                                  ? ` +${activeCheckouts.length - 1}`
                                  : ""}
                              </span>
                            </>
                          ) : null}
                        </p>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          onClick={(event) => event.stopPropagation()}
                        >
                          {canAssign && (
                            <button
                              type="button"
                              onClick={() => setAssigning(item)}
                              className="pressable inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-border/80 text-[11px] font-medium hover:bg-surface-elevated transition-colors"
                            >
                              <ClipboardCheck className="w-3 h-3" />
                              Assign
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setEditing(item)}
                            className="pressable p-1.5 rounded-lg hover:bg-surface-elevated text-muted hover:text-foreground transition-colors"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(item);
                            }}
                            className="pressable p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                            aria-label={`Delete ${item.name}`}
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
                visibleCount={Math.min(mobileLimit, items.length)}
                totalCount={items.length}
                initialLimit={6}
                noun="items"
                onShowMore={() => setMobileLimit((prev) => prev + 6)}
                onCollapse={() => setMobileLimit(6)}
              />
            </div>

            {/* Desktop: full table */}
            <div className="hidden md:block border border-border/70 rounded-2xl overflow-hidden bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-x-auto">
              <table className="w-full min-w-[1120px] text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-surface-elevated/40 text-left text-xs font-medium text-muted">
                    <th className="px-5 py-3 font-medium">Item</th>
                    <th className="px-4 py-3 font-medium">Identifier / Qty</th>
                    <th className="px-4 py-3 font-medium">Condition</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assigned to</th>
                    <th className="px-4 py-3 font-medium">Contact</th>
                    <th className="px-4 py-3 font-medium">Assigned by</th>
                    <th className="px-5 py-3 font-medium w-36 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {items.map((item) => {
                    const activeCheckouts = activeCheckoutsByItemId.get(item.id) ?? [];
                    const primaryAssignment = activeCheckouts[0];
                    const canAssign =
                      item.status !== "checked-out" && (item.quantity === null || item.quantity > 0);

                    return (
                      <tr
                        key={item.id}
                        className="cursor-pointer hover:bg-surface-elevated/40 text-foreground transition-colors"
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedItem(item)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedItem(item);
                          }
                        }}
                      >
                        <td className="px-5 py-3.5">
                          <div className="font-medium">{item.name}</div>
                          {item.notes && (
                            <div className="text-xs text-muted mt-0.5">{item.notes}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted font-mono text-xs">
                          {item.quantity !== null
                            ? `${item.quantity} units`
                            : getItemIdentifierLabel(item)}
                        </td>
                        <td className="px-4 py-3.5 text-muted capitalize">{item.condition}</td>
                        <td className="px-4 py-3.5">
                          <StatusPill status={item.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          {activeCheckouts.length === 0 ? (
                            <span className="text-muted">—</span>
                          ) : (
                            <div>
                              <div className="font-medium">{primaryAssignment.assignedToName}</div>
                              {activeCheckouts.length > 1 && (
                                <div className="text-xs text-muted">
                                  +{activeCheckouts.length - 1} more active
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted text-xs">
                          {primaryAssignment ? (
                            <div>
                              <div>{primaryAssignment.assignedToPhone || "-"}</div>
                              <div className="font-mono">
                                {primaryAssignment.assignedToEmail || "-"}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-muted text-xs">
                          {primaryAssignment?.collectedBy ?? "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            {canAssign && (
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setAssigning(item);
                                }}
                                className="pressable inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-border/80 text-xs font-medium hover:bg-surface-elevated transition-colors"
                              >
                                <ClipboardCheck className="w-3.5 h-3.5 text-muted" />
                                Assign
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setEditing(item);
                              }}
                              className="pressable p-1.5 rounded-lg hover:bg-surface-elevated text-muted hover:text-foreground transition-colors"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                setDeleteError(null);
                                setDeleting(item);
                              }}
                              className="pressable p-1.5 rounded-lg hover:bg-rose-500/10 text-muted hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              aria-label={`Delete ${item.name}`}
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


      {selectedItem && (
        <ItemDetailsModal
          item={selectedItem}
          category={category}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {showCreate && (
        <ItemFormModal
          categories={[category]}
          defaultCategoryId={category.id}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <ItemFormModal
          item={editing}
          categories={[category]}
          onClose={() => setEditing(null)}
        />
      )}
      {assigning && (
        <CheckoutModal
          items={[assigning]}
          categories={[category]}
          assigners={assigners}
          defaultAssignedBy={currentAdmin.name}
          onClose={() => setAssigning(null)}
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs px-4">
          <div className="modal-panel bg-surface rounded-2xl border border-border/70 max-w-sm w-full p-5 shadow-xl">
            <h2 className="font-semibold text-sm mb-1.5">Delete item</h2>
            <p className="text-sm text-muted mb-4">
              This deletes &ldquo;{deleting.name}&rdquo; and its checkout history. This can&apos;t
              be undone.
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

function MiniStat({
  label,
  value,
  warning,
}: {
  label: string;
  value: number;
  warning?: boolean;
}) {
  return (
    <div className="border border-border/70 rounded-2xl bg-surface p-3.5 sm:p-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={`mt-1.5 sm:mt-2 text-xl sm:text-2xl font-bold tracking-tight tabular-nums ${
          warning ? "text-amber-600 dark:text-amber-400" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
