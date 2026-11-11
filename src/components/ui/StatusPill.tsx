import { ItemStatus, CheckoutStatus, UserStatus } from "@/types";

type Status = ItemStatus | CheckoutStatus | UserStatus;

const STATUS_META: Record<
  Status,
  { label: string; badgeClass: string; dotClass: string }
> = {
  available: {
    label: "Available",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  "checked-out": {
    label: "Assigned",
    badgeClass:
      "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
    dotClass: "bg-brand-teal",
  },
  "low-stock": {
    label: "Low Stock",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  active: {
    label: "Active",
    badgeClass:
      "bg-brand-teal/10 text-brand-teal border-brand-teal/20",
    dotClass: "bg-brand-teal",
  },
  inactive: {
    label: "Inactive",
    badgeClass: "bg-surface-elevated text-muted border-border/70",
    dotClass: "bg-slate-400",
  },
  pending: {
    label: "Pending",
    badgeClass:
      "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    dotClass: "bg-amber-500",
  },
  returned: {
    label: "Returned",
    badgeClass:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    dotClass: "bg-emerald-500",
  },
  overdue: {
    label: "Overdue",
    badgeClass:
      "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    dotClass: "bg-rose-500",
  },
};

export function StatusPill({ status }: { status: Status }) {
  const meta = STATUS_META[status] ?? {
    label: String(status),
    badgeClass: "bg-surface-elevated text-muted border-border/70",
    dotClass: "bg-slate-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium whitespace-nowrap ${meta.badgeClass}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${meta.dotClass}`} />
      <span>{meta.label}</span>
    </span>
  );
}
