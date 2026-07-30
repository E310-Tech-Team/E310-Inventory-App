"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ClipboardCheck, Pencil, Plus, Trash2 } from "lucide-react";
import { Category, Checkout, Item } from "@/types";
import { getEffectiveStatus } from "@/lib/checkout-status";
import { getItemIdentifierLabel } from "@/lib/items";
import { CheckoutModal } from "@/components/checkouts/CheckoutModal";
import { ItemFormModal } from "@/components/items/ItemFormModal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";

export function CategoryDetailView({
  category,
  items,
  checkouts,
}: {
  category: Category;
  items: Item[];
  checkouts: Checkout[];
}) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [assigning, setAssigning] = useState<Item | null>(null);
  const [deleting, setDeleting] = useState<Item | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
            onClick={() => setShowCreate(true)}
            className="pressable flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New item
          </button>
        }
      />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        <Link
          href="/categories"
          className="pressable inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Categories
        </Link>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <MiniStat label="Total" value={stats.total} />
          <MiniStat label="Available" value={stats.available} />
          <MiniStat label="Assigned" value={stats.assigned} />
          <MiniStat label="Low stock" value={stats.lowStock} warning={stats.lowStock > 0} />
        </div>

        {items.length === 0 ? (
          <div className="animate-enter border border-dashed border-border rounded-xl py-16 text-center">
            <p className="text-sm text-muted mb-4">No items recorded in this category yet.</p>
            <button
              onClick={() => setShowCreate(true)}
              className="pressable inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              New item
            </button>
          </div>
        ) : (
          <div className="interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
            <table className="w-full min-w-[1120px] text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Identifier / Qty</th>
                  <th className="px-4 py-3 font-medium">Condition</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Assigned to</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Assigned by</th>
                  <th className="px-4 py-3 font-medium w-36"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => {
                  const activeCheckouts = activeCheckoutsByItemId.get(item.id) ?? [];
                  const primaryAssignment = activeCheckouts[0];
                  const canAssign =
                    item.status !== "checked-out" && (item.quantity === null || item.quantity > 0);

                  return (
                    <tr key={item.id} className="table-row border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        {item.notes && (
                          <div className="text-xs text-muted mt-0.5">{item.notes}</div>
                        )}
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
                        {activeCheckouts.length === 0 ? (
                          <span className="text-muted">-</span>
                        ) : (
                          <div>
                            <div>{primaryAssignment.assignedToName}</div>
                            {activeCheckouts.length > 1 && (
                              <div className="text-xs text-muted">
                                +{activeCheckouts.length - 1} more active
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {primaryAssignment ? (
                          <div>
                            <div>{primaryAssignment.assignedToPhone || "-"}</div>
                            <div className="font-mono text-xs">
                              {primaryAssignment.assignedToEmail || "-"}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">
                        {primaryAssignment?.collectedBy ?? "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {canAssign && (
                            <button
                              onClick={() => setAssigning(item)}
                              className="pressable inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border text-xs font-medium hover:bg-background"
                            >
                              <ClipboardCheck className="w-3.5 h-3.5" />
                              Assign
                            </button>
                          )}
                          <button
                            onClick={() => setEditing(item)}
                            className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-foreground"
                            aria-label={`Edit ${item.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteError(null);
                              setDeleting(item);
                            }}
                            className="pressable p-1.5 rounded hover:bg-background text-muted hover:text-status-overdue"
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
        )}
      </div>

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
          onClose={() => setAssigning(null)}
        />
      )}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="modal-panel bg-surface rounded-2xl border border-border max-w-sm w-full p-5">
            <h2 className="font-semibold text-sm mb-1.5">Delete item</h2>
            <p className="text-sm text-muted mb-4">
              This deletes &ldquo;{deleting.name}&rdquo; and its checkout history. This can&apos;t
              be undone.
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
    <div className="interactive-card border border-border rounded-xl bg-surface px-4 py-3">
      <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
      <p
        className={`text-xl font-semibold font-mono ${
          warning ? "text-status-low-stock" : "text-foreground"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
