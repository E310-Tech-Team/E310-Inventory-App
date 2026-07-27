import { Checkout, CheckoutStatus } from "@/types";

export function getEffectiveStatus(checkout: Checkout): CheckoutStatus {
  if (checkout.status === "returned") return "returned";
  if (checkout.dueDate && new Date(checkout.dueDate) < new Date()) {
    return "overdue";
  }
  return "active";
}

export function isOverdue(checkout: Checkout): boolean {
  return getEffectiveStatus(checkout) === "overdue";
}
