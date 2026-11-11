export const STAFF_ID_PREFIX = "E310";

const STAFF_ID_PATTERN = /^(?:E310|R4C)-(\d+)$/i;
const DIGITS_ONLY_PATTERN = /^(\d+)$/;

/**
 * Normalize staff IDs to the canonical `E310-XXX` format (e.g. `E310-002`).
 * Preserves unrecognized non-empty strings trimmed & uppercased so validation can handle them.
 */
export function formatStaffId(value?: string | null): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const prefixed = trimmed.match(STAFF_ID_PATTERN);
  if (prefixed) {
    return `${STAFF_ID_PREFIX}-${String(Number(prefixed[1])).padStart(3, "0")}`;
  }

  const numeric = trimmed.match(DIGITS_ONLY_PATTERN);
  if (numeric) {
    return `${STAFF_ID_PREFIX}-${String(Number(numeric[1])).padStart(3, "0")}`;
  }

  return trimmed.toUpperCase();
}

/** Validate that a non-empty normalized staff ID follows `E310-XXX`. */
export function isValidStaffId(value: string): boolean {
  return /^E310-\d{3,}$/.test(value);
}

/** Compute the next sequential `E310-XXX` staff ID (e.g. `E310-011`). */
export function generateNextStaffId(
  existingIds: Array<string | null | undefined>
): string {
  let maxNumber = 0;

  for (const raw of existingIds) {
    if (!raw) continue;
    const match = raw.trim().match(STAFF_ID_PATTERN);
    if (!match) continue;
    const num = Number(match[1]);
    if (Number.isFinite(num) && num > maxNumber) {
      maxNumber = num;
    }
  }

  return `${STAFF_ID_PREFIX}-${String(maxNumber + 1).padStart(3, "0")}`;
}

