import React from "react";

export type BadgeVariant =
  | "active"
  | "overdue"
  | "under-review"
  | "resolved"
  | "in-repair"
  | "submitted"
  | "available"
  | "pending"
  | "neutral";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: BadgeVariant;
  label?: string;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  label,
  className = "",
}: BadgeProps) {
  const displayContent = children || label || variant.toUpperCase();

  const variantStyles: Record<
    BadgeVariant,
    { badge: string; dot: string }
  > = {
    active: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    available: {
      badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
      dot: "bg-emerald-500",
    },
    overdue: {
      badge: "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20",
      dot: "bg-rose-500",
    },
    "under-review": {
      badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
      dot: "bg-amber-500",
    },
    "in-repair": {
      badge: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
      dot: "bg-blue-500",
    },
    submitted: {
      badge: "bg-surface-subtle text-foreground-muted border-border",
      dot: "bg-muted",
    },
    resolved: {
      badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
      dot: "bg-teal-500",
    },
    pending: {
      badge: "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20",
      dot: "bg-amber-500",
    },
    neutral: {
      badge: "bg-surface-subtle text-foreground-muted border-border",
      dot: "bg-muted",
    },
  };

  const currentConfig = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border select-none ${currentConfig.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${currentConfig.dot}`} />
      <span>{displayContent}</span>
    </span>
  );
}
