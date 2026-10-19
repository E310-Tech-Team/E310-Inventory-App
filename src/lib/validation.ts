import {
  CheckoutStatus,
  ItemCondition,
  ItemIdentifierType,
  ItemStatus,
  ReturnType,
  TrackingType,
  UserRole,
  UserStatus,
} from "@/types";

const TRACKING_TYPES: TrackingType[] = ["individual", "quantity"];
const RETURN_TYPES: ReturnType[] = ["fixed-date", "open-ended"];
const ITEM_CONDITIONS: ItemCondition[] = ["new", "good", "fair", "damaged"];
const ITEM_STATUSES: ItemStatus[] = ["available", "checked-out", "low-stock"];
const CHECKOUT_STATUSES: CheckoutStatus[] = ["active", "returned", "overdue"];
const ITEM_IDENTIFIER_TYPES: ItemIdentifierType[] = [
  "serial-number",
  "asset-tag",
  "service-tag",
  "imei",
  "model-number",
  "other",
];
const USER_ROLES: UserRole[] = [
  "super-admin",
  "tech-support",
  "staff",
  "team-member",
  "viewer",
];
const USER_STATUSES: UserStatus[] = ["active", "inactive", "pending"];

export function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanOptionalString(value: unknown): string | null {
  const text = cleanString(value);
  return text || null;
}

export function isTrackingType(value: unknown): value is TrackingType {
  return typeof value === "string" && TRACKING_TYPES.includes(value as TrackingType);
}

export function isReturnType(value: unknown): value is ReturnType {
  return typeof value === "string" && RETURN_TYPES.includes(value as ReturnType);
}

export function isItemCondition(value: unknown): value is ItemCondition {
  return typeof value === "string" && ITEM_CONDITIONS.includes(value as ItemCondition);
}

export function isItemStatus(value: unknown): value is ItemStatus {
  return typeof value === "string" && ITEM_STATUSES.includes(value as ItemStatus);
}

export function isCheckoutStatus(value: unknown): value is CheckoutStatus {
  return typeof value === "string" && CHECKOUT_STATUSES.includes(value as CheckoutStatus);
}

export function isItemIdentifierType(value: unknown): value is ItemIdentifierType {
  return (
    typeof value === "string" &&
    ITEM_IDENTIFIER_TYPES.includes(value as ItemIdentifierType)
  );
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && USER_ROLES.includes(value as UserRole);
}

export function isUserStatus(value: unknown): value is UserStatus {
  return typeof value === "string" && USER_STATUSES.includes(value as UserStatus);
}

export function toNonNegativeInteger(value: unknown): number | null {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0) return null;
  return number;
}

export function toPositiveInteger(value: unknown): number | null {
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) return null;
  return number;
}

export function toIsoDate(value: unknown): string | null {
  if (typeof value !== "string" || !value) return null;
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return null;
  return new Date(timestamp).toISOString();
}
