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
  pulsing?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  label,
  pulsing,
  className = "",
}: BadgeProps) {
  const displayContent = children || label || variant.toUpperCase();

  const variantStyles: Record<
    BadgeVariant,
    { badge: string; dot: string; ping: string }
  > = {
    active: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      dot: "bg-emerald-400",
      ping: "bg-emerald-400",
    },
    available: {
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
      dot: "bg-emerald-400",
      ping: "bg-emerald-400",
    },
    overdue: {
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      dot: "bg-rose-400",
      ping: "bg-rose-400",
    },
    "under-review": {
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/25",
      dot: "bg-amber-400",
      ping: "bg-amber-400",
    },
    "in-repair": {
      badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/25",
      dot: "bg-indigo-400",
      ping: "bg-indigo-400",
    },
    submitted: {
      badge: "bg-sky-500/10 text-sky-400 border-sky-500/25",
      dot: "bg-sky-400",
      ping: "bg-sky-400",
    },
    resolved: {
      badge: "bg-teal-500/10 text-teal-300 border-teal-500/25",
      dot: "bg-teal-400",
      ping: "bg-teal-400",
    },
    pending: {
      badge: "bg-amber-500/10 text-amber-300 border-amber-500/25",
      dot: "bg-amber-400",
      ping: "bg-amber-400",
    },
    neutral: {
      badge: "bg-neutral-800/80 text-neutral-300 border-neutral-700/60",
      dot: "bg-neutral-400",
      ping: "bg-neutral-400",
    },
  };

  const currentConfig = variantStyles[variant] || variantStyles.neutral;
  const isPulsing =
    pulsing ?? (variant === "active" || variant === "overdue" || variant === "under-review" || variant === "in-repair");

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium tracking-wide border select-none transition-colors ${currentConfig.badge} ${className}`}
    >
      {isPulsing ? (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConfig.ping}`}
          />
          <span
            className={`relative inline-flex rounded-full h-1.5 w-1.5 ${currentConfig.dot}`}
          />
        </span>
      ) : (
        <span className={`inline-block h-1.5 w-1.5 rounded-full ${currentConfig.dot}`} />
      )}
      <span>{displayContent}</span>
    </span>
  );
}
