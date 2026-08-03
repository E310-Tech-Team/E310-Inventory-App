"use client";

import { Modal } from "@/components/ui/Modal";
import { StatusPill } from "@/components/ui/StatusPill";
import { Category, Item } from "@/types";
import { getItemIdentifierLabel } from "@/lib/items";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export function ItemDetailsModal({
  item,
  category,
  onClose,
}: {
  item: Item;
  category: Category | null;
  onClose: () => void;
}) {
  return (
    <Modal title={item.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold text-sm">Item overview</h3>
            <StatusPill status={item.status} />
          </div>
          <div className="mt-3 space-y-1">
            <DetailRow label="Name" value={item.name} />
            <DetailRow label="Category" value={category?.name ?? "Uncategorized"} />
            <DetailRow label="Identifier" value={getItemIdentifierLabel(item)} />
            <DetailRow label="Quantity" value={item.quantity?.toString() ?? "—"} />
            <DetailRow label="Condition" value={item.condition} />
            <DetailRow label="Status" value={item.status} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-background/40 p-4">
          <h3 className="font-semibold text-sm">Notes</h3>
          <p className="mt-3 text-sm text-muted whitespace-pre-wrap">
            {item.notes || "No additional notes for this item."}
          </p>
        </div>
      </div>
    </Modal>
  );
}
