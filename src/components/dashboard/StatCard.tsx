export function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger";
}) {
  const toneClass =
    tone === "danger"
      ? "text-status-overdue"
      : tone === "warning"
        ? "text-status-low-stock"
        : "text-foreground";

  return (
    <div className="interactive-card animate-enter border border-border rounded-xl bg-surface px-4 py-3.5">
      <p className="text-xs text-muted uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-semibold font-mono ${toneClass}`}>{value}</p>
    </div>
  );
}
