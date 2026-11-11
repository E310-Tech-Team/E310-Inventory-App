"use client";

interface ShowMoreBarProps {
  visibleCount: number;
  totalCount: number;
  initialLimit: number;
  step?: number;
  noun?: string;
  standalone?: boolean;
  onShowMore: () => void;
  onCollapse?: () => void;
}

/**
 * Compact mobile/list footer that prevents long vertical scrolling by revealing items progressively.
 */
export function ShowMoreBar({
  visibleCount,
  totalCount,
  initialLimit,
  step = 6,
  noun = "items",
  standalone = false,
  onShowMore,
  onCollapse,
}: ShowMoreBarProps) {
  if (totalCount <= initialLimit && visibleCount <= initialLimit) {
    return null;
  }

  const remaining = Math.max(0, totalCount - visibleCount);
  const nextBatch = Math.min(step, remaining);

  return (
    <div
      className={`flex items-center justify-between gap-2 px-4 py-2.5 text-xs ${
        standalone
          ? "mt-2 rounded-xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)]"
          : "border-t border-border/50 bg-surface-elevated/25"
      }`}
    >
      <span className="text-muted tabular-nums">
        Showing <span className="font-medium text-foreground">{Math.min(visibleCount, totalCount)}</span> of{" "}
        <span className="font-medium text-foreground">{totalCount}</span> {noun}
      </span>

      <div className="flex items-center gap-2">
        {visibleCount > initialLimit && onCollapse && (
          <button
            type="button"
            onClick={onCollapse}
            className="px-2.5 py-1 rounded-lg border border-border/70 bg-surface text-muted hover:text-foreground font-medium transition-colors"
          >
            Show less
          </button>
        )}
        {remaining > 0 && (
          <button
            type="button"
            onClick={onShowMore}
            className="px-2.5 py-1 rounded-lg border border-border/70 bg-surface text-accent hover:bg-surface-elevated font-medium transition-colors tabular-nums"
          >
            Show {nextBatch} more
          </button>
        )}
      </div>
    </div>
  );
}
