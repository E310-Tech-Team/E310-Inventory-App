"use client";

import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { getEffectiveStatus } from "@/lib/checkout-status";
import { Category, Checkout, Item } from "@/types";

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export function CheckoutDetailsModal({
  checkout,
  item,
  category,
  onClose,
}: {
  checkout: Checkout;
  item: Item | null;
  category: Category | null;
  onClose: () => void;
}) {
  const status = getEffectiveStatus(checkout);

  return (
    <Modal title={item?.name ? `Checkout details — ${item.name}` : "Checkout details"} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-sm">Item details</h3>
            <StatusPill status={status} />
          </div>
          <div className="mt-3 space-y-1">
            <DetailRow label="Name" value={item?.name ?? "Unknown item"} />
            <DetailRow label="Category" value={category?.name ?? "Uncategorized"} />
            <DetailRow label="Quantity" value={checkout.quantity?.toString() ?? "—"} />
            <DetailRow label="Serial / identifier" value={item?.serialNumber ?? item?.identifierValue ?? "—"} />
            <DetailRow label="Condition on collection" value={checkout.conditionOnCollection} />
            <DetailRow label="Notes" value={checkout.collectionNotes ?? item?.notes ?? "—"} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/40 p-4">
          <h3 className="font-semibold text-sm">Recipient details</h3>
          <div className="mt-3 space-y-1">
            <DetailRow label="Name" value={checkout.assignedToName} />
            <DetailRow label="Phone" value={checkout.assignedToPhone} />
            <DetailRow label="Email" value={checkout.assignedToEmail} />
            <DetailRow label="Processed by" value={checkout.collectedBy} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/40 p-4">
          <h3 className="font-semibold text-sm">Checkout timeline</h3>
          <div className="mt-3 space-y-1">
            <DetailRow label="Collected" value={formatDate(checkout.dateCollected)} />
            <DetailRow label="Due" value={formatDate(checkout.dueDate)} />
            <DetailRow label="Returned" value={formatDate(checkout.dateReturned)} />
            <DetailRow label="Condition on return" value={checkout.conditionOnReturn ?? "—"} />
            <DetailRow label="Return notes" value={checkout.returnNotes ?? "—"} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
