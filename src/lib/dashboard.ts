import { Category, Item, Checkout } from "@/types";
import { getEffectiveStatus } from "./checkout-status";

export function getCheckedOutView(checkouts: Checkout[], items: Item[]) {
  const itemById = new Map(items.map((i) => [i.id, i]));
  return checkouts
    .filter((c) => getEffectiveStatus(c) !== "returned")
    .map((c) => ({ checkout: c, item: itemById.get(c.itemId) }))
    .sort((a, b) => new Date(b.checkout.dateCollected).getTime() - new Date(a.checkout.dateCollected).getTime());
}

export function getOverdueView(checkouts: Checkout[], items: Item[]) {
  const itemById = new Map(items.map((i) => [i.id, i]));
  return checkouts
    .filter((c) => getEffectiveStatus(c) === "overdue")
    .map((c) => ({ checkout: c, item: itemById.get(c.itemId) }))
    .sort((a, b) => new Date(a.checkout.dueDate!).getTime() - new Date(b.checkout.dueDate!).getTime());
}

export function getLowStockView(items: Item[], categories: Category[]) {
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  return items
    .filter((i) => i.status === "low-stock")
    .map((i) => ({ item: i, category: categoryById.get(i.categoryId) }));
}

export function getCategoryBreakdown(items: Item[], categories: Category[]) {
  return categories.map((category) => {
    const categoryItems = items.filter((i) => i.categoryId === category.id);
    return {
      category,
      totalItems: categoryItems.length,
      checkedOut: categoryItems.filter((i) => i.status === "checked-out").length,
      available: categoryItems.filter((i) => i.status === "available").length,
      lowStock: categoryItems.filter((i) => i.status === "low-stock").length,
    };
  });
}

export function getPersonHistory(checkouts: Checkout[], adminName: string) {
  return checkouts
    .filter((c) => (c.assignedToName || c.collectedBy) === adminName)
    .sort((a, b) => new Date(b.dateCollected).getTime() - new Date(a.dateCollected).getTime());
}

export function getItemHistory(checkouts: Checkout[], itemId: string) {
  return checkouts
    .filter((c) => c.itemId === itemId)
    .sort((a, b) => new Date(b.dateCollected).getTime() - new Date(a.dateCollected).getTime());
}
