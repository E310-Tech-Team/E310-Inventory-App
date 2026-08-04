"use client";

import { Modal } from "@/components/ui/Modal";
import { Category } from "@/types";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border last:border-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export function CategoryDetailsModal({
  category,
  itemCount,
  onClose,
}: {
  category: Category;
  itemCount: number;
  onClose: () => void;
}) {
  return (
    <Modal title={category.name} onClose={onClose}>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-background/40 p-4">
          <h3 className="font-semibold text-sm">Category overview</h3>
          <div className="mt-3 space-y-1">
            <DetailRow label="Name" value={category.name} />
            <DetailRow label="Items" value={itemCount.toString()} />
            <DetailRow label="Tracking" value={category.trackingType} />
            <DetailRow label="Return" value={category.returnType.replace("-", " ")} />
            <DetailRow label="Created by" value={category.createdBy} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
