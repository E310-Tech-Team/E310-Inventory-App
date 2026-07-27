"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Checkout, Item, Category } from "@/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusPill } from "@/components/ui/StatusPill";
import { getEffectiveStatus } from "@/lib/checkout-status";
import { CheckInModal } from "./CheckInModal";

export function CheckoutsList({
  checkouts,
  items,
  categories,
}: {
  checkouts: Checkout[];
  items: Item[];
  categories: Category[];
}) {
  const [filter, setFilter] = useState<"all" | "active" | "overdue" | "returned">("all");
  const [query, setQuery] = useState("");
  const [checkingIn, setCheckingIn] = useState<Checkout | null>(null);

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

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return sorted.filter((checkout) => {
      const item = itemById.get(checkout.itemId);
      const category = item ? categoryById.get(item.categoryId) : null;
      const status = getEffectiveStatus(checkout);
      const matchesFilter = filter === "all" || status === filter;
      const matchesQuery =
        !normalizedQuery ||
        [
          item?.name,
          item?.serialNumber,
          category?.name,
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

        {filtered.length === 0 ? (
          <div className="animate-enter border border-dashed border-border rounded-xl py-16 text-center">
            <p className="text-sm text-muted">No checkouts found.</p>
          </div>
        ) : (
          <div className="interactive-card border border-border rounded-xl overflow-hidden bg-surface overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background text-left text-xs text-muted uppercase tracking-wide">
                  <th className="px-4 py-3 font-medium">Item</th>
                  <th className="px-4 py-3 font-medium">Assigned to</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Processed by</th>
                  <th className="px-4 py-3 font-medium">Collected</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Returned</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium w-24"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((checkout) => {
                  const item = itemById.get(checkout.itemId);
                  const status = getEffectiveStatus(checkout);
                  return (
                    <tr key={checkout.id} className="table-row border-b border-border last:border-0">
                      <td className="px-4 py-3 font-medium">
                        {item?.name ?? "Unknown item"}
                        {checkout.quantity !== null && (
                          <span className="text-muted font-normal"> ({checkout.quantity})</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">
                        {checkout.assignedToName}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        <div>{checkout.assignedToPhone || "-"}</div>
                        <div className="font-mono text-xs">{checkout.assignedToEmail || "-"}</div>
                      </td>
                      <td className="px-4 py-3 text-muted font-mono text-xs">
                        {checkout.collectedBy}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {new Date(checkout.dateCollected).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {checkout.dueDate
                          ? new Date(checkout.dueDate).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {checkout.dateReturned
                          ? new Date(checkout.dateReturned).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusPill status={status} />
                      </td>
                      <td className="px-4 py-3">
                        {status !== "returned" && (
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
