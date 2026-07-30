import { ItemStatus, CheckoutStatus, UserStatus } from "@/types";

type Status = ItemStatus | CheckoutStatus | UserStatus;

const LABELS: Record<Status, string> = {
  available: "AVAILABLE",
  "checked-out": "ASSIGNED",
  "low-stock": "LOW STOCK",
  active: "ACTIVE",
  inactive: "INACTIVE",
  pending: "PENDING",
  returned: "RETURNED",
  overdue: "OVERDUE",
};

const STYLES: Record<Status, string> = {
  available: "text-status-available bg-status-available-bg",
  "checked-out": "text-status-checked-out bg-status-checked-out-bg",
  "low-stock": "text-status-low-stock bg-status-low-stock-bg",
  active: "text-status-checked-out bg-status-checked-out-bg",
  inactive: "text-muted bg-background",
  pending: "text-accent bg-accent-soft",
  returned: "text-status-available bg-status-available-bg",
  overdue: "text-status-overdue bg-status-overdue-bg",
};

export function StatusPill({ status }: { status: Status }) {
  const liveClass =
    status === "active" || status === "overdue" || status === "low-stock"
      ? "status-live"
      : "";

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded font-mono text-[11px] font-medium tracking-wide ${STYLES[status]} ${liveClass}`}
    >
      {LABELS[status]}
    </span>
  );
}
