export function StatCard({
  label,
  value,
  tone,
  onClick,
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger";
  onClick?: () => void;
}) {
  const toneClass =
    tone === "danger"
      ? "text-status-overdue"
      : tone === "warning"
        ? "text-status-low-stock"
        : "text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={`interactive-card animate-enter border border-border rounded-xl bg-surface px-4 py-3.5 text-left ${onClick ? "cursor-pointer hover:border-accent/40" : "cursor-default"}`}
    >
      <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-semibold font-mono ${toneClass}`}>{value}</p>
    </button>
  );
}
