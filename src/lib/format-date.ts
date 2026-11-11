/**
 * Parse a database or ISO timestamp into a Date, treating timezone-naive
 * date-time strings (e.g. "2026-11-10T16:57:29") as UTC to avoid local-clock shifts.
 */
export function parseTimestamp(value?: string | null): Date | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  // Date-only values ("YYYY-MM-DD") stay in standard parsing
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T00:00:00`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // Normalize space separator and append "Z" if a datetime has no timezone offset
  let normalized = trimmed.replace(" ", "T");
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) && !/(Z|[+-]\d{2}:?\d{2})$/i.test(normalized)) {
    normalized = `${normalized}Z`;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Format a timestamp as an unambiguous date (e.g. "Nov 10, 2026"). */
export function formatDate(value?: string | null, fallback = "Recently"): string {
  const d = parseTimestamp(value);
  if (!d) return fallback;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format a timestamp with unambiguous date and 12-hour time (e.g. "Nov 10, 2026, 5:57 PM"). */
export function formatDateTime(value?: string | null, fallback = "Recently"): string {
  const d = parseTimestamp(value);
  if (!d) return fallback;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Compact date & time without year for tight mobile rows (e.g. "Nov 10, 5:57 PM"). */
export function formatCompactDateTime(value?: string | null, fallback = "Recently"): string {
  const d = parseTimestamp(value);
  if (!d) return fallback;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

