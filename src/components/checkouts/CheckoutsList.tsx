"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Checkout, Item, Category } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { getEffectiveStatus } from "@/lib/checkout-status";
import { CheckInModal } from "./CheckInModal";
import { CheckoutDetailsModal } from "./CheckoutDetailsModal";

export function CheckoutsList({
  checkouts,
  items,
  categories,
}: {
  checkouts: Checkout[];
  items: Item[];
  categories: Category[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "returned">("all");
  const [query, setQuery] = useState("");
  const [checkingIn, setCheckingIn] = useState<Checkout | null>(null);
  const [selectedCheckout, setSelectedCheckout] = useState<Checkout | null>(null);
  const [undoingCheckoutId, setUndoingCheckoutId] = useState<string | null>(null);
  const [undoError, setUndoError] = useState<string | null>(null);

  const itemById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories]
  );

  const sorted = useMemo(
    () =>
      [...checkouts].sort(
        (a, b) => new Date(b.dateCollected).getTime() - new Date(a.dateCollected).getTime()
      ),
    [checkouts]
  );

  async function handleUndoCheckout(checkout: Checkout) {
    setUndoingCheckoutId(checkout.id);
    setUndoError(null);

    const response = await fetch(`/api/checkouts/${checkout.id}/undo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      setUndoError("Couldn't undo the check-in. Try again.");
      setUndoingCheckoutId(null);
      return;
    }

    setUndoingCheckoutId(null);
    router.refresh();
  }

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sorted.filter((checkout) => {
      const item = itemById.get(checkout.itemId);
      const status = getEffectiveStatus(checkout);
      const categoryName = item?.categoryId ? categoryById.get(item.categoryId)?.name : null;
      const matchesFilter = filter === "all" || status === filter;
      const matchesQuery =
        !normalizedQuery ||
        [
          item?.name,
          item?.serialNumber,
          categoryName,
          checkout.collectedBy,
          checkout.assignedToName,
          checkout.assignedToPhone,
          checkout.assignedToEmail,
          checkout.quantity?.toString(),
          checkout.dateCollected,
          checkout.dueDate,
          checkout.dateReturned,
          status,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(normalizedQuery));

      return matchesFilter && matchesQuery;
    });
  }, [categoryById, filter, itemById, query, sorted]);

  return (
    <div>
      <PageHeader
        title="Checkouts"
        description="View active assignments, returns, and overdue items"
      />

      <div className="px-4 md:px-8 pb-8 animate-enter">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
          <div className="relative sm:w-72">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface text-sm outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-ring/45"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search checkouts"
            />
          </div>
          <div className="flex gap-1 overflow-x-auto">
          {(["all", "active", "overdue", "returned"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`pressable px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-accent text-white"
                  : "bg-surface border border-border text-muted hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
          </div>
        </div>

        {undoError && (
          <div className="mb-4 rounded-lg border border-status-overdue/30 bg-status-overdue/10 px-3 py-2 text-sm text-status-overdue">
            {undoError}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="animate-enter border border-dashed border-border rounded-xl py-16 text-center">
            <p className="text-sm text-muted">No checkouts found.</p>
          </div>
        ) : (
          <div className="interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-3 py-2.5 font-medium w-[24%]">Item</th>
                  <th className="px-3 py-2.5 font-medium w-[16%]">Assigned to</th>
                  <th className="px-3 py-2.5 font-medium w-[15%]">Processed by</th>
                  <th className="px-3 py-2.5 font-medium w-[12%]">Collected</th>
                  <th className="px-3 py-2.5 font-medium w-[10%]">Due</th>
                  <th className="px-3 py-2.5 font-medium w-[10%]">Returned</th>
                  <th className="px-3 py-2.5 font-medium w-[10%]">Status</th>
                  <th className="px-3 py-2.5 font-medium w-[12%]"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((checkout) => {
                  const item = itemById.get(checkout.itemId);
                  const status = getEffectiveStatus(checkout);
                  return (
                    <tr
                      key={checkout.id}
                      className="table-row border-b border-border last:border-0 cursor-pointer hover:bg-accent-soft/70 text-foreground"
                      role="button"
                      tabIndex={0}
                      onClick={(event) => {
                        if ((event.target as HTMLElement).closest("button")) return;
                        setSelectedCheckout(checkout);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedCheckout(checkout);
                        }
                      }}
                    >
                      <td className="px-3 py-2.5 font-medium whitespace-normal break-words">
                        {item?.name ?? "Unknown item"}
                        {checkout.quantity !== null && (
                          <span className="text-muted font-normal"> ({checkout.quantity})</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-foreground font-mono text-xs">
                        {checkout.assignedToName}
                      </td>
                      <td className="px-3 py-2.5 text-foreground font-mono text-xs">
                        {checkout.collectedBy}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">
                        {new Date(checkout.dateCollected).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">
                        {checkout.dueDate
                          ? new Date(checkout.dueDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-foreground">
                        {checkout.dateReturned
                          ? new Date(checkout.dateReturned).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-3 py-2.5">
                        <StatusPill status={status} />
                      </td>
                      <td className="px-3 py-2.5 whitespace-nowrap" onClick={(event) => event.stopPropagation()}>
                        {status === "returned" ? (
                          <button
                            onClick={() => handleUndoCheckout(checkout)}
                            disabled={undoingCheckoutId === checkout.id}
                            className="pressable px-2.5 py-1 rounded-lg border border-border text-xs font-medium hover:bg-background disabled:opacity-50"
                          >
                            {undoingCheckoutId === checkout.id ? "Undoing…" : "Undo"}
                          </button>
                        ) : (
                          <button
                            onClick={() => setCheckingIn(checkout)}
                            className="pressable px-2.5 py-1 rounded-lg border border-border text-xs font-medium hover:bg-background"
                          >
                            Check in
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedCheckout && (() => {
        const selectedItem = itemById.get(selectedCheckout.itemId) ?? null;
        const selectedCategory = selectedItem?.categoryId
          ? categoryById.get(selectedItem.categoryId) ?? null
          : null;

        return (
          <CheckoutDetailsModal
            checkout={selectedCheckout}
            item={selectedItem}
            category={selectedCategory}
            onClose={() => setSelectedCheckout(null)}
          />
        );
      })()}

      {checkingIn && (
        <CheckInModal
          checkout={checkingIn}
          itemName={itemById.get(checkingIn.itemId)?.name ?? "Item"}
          onClose={() => setCheckingIn(null)}
        />
      )}
    </div>
  );
}
