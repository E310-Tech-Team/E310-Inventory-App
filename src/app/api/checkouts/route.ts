import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";
import {
  cleanOptionalString,
  cleanString,
  isItemCondition,
  toIsoDate,
  toPositiveInteger,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const itemId = request.nextUrl.searchParams.get("itemId");
  const adminName = request.nextUrl.searchParams.get("admin");

  if (itemId) {
    return NextResponse.json(await dataStore.getCheckoutsByItem(itemId));
  }
  if (adminName) {
    return NextResponse.json(await dataStore.getCheckoutsByAdmin(adminName));
  }

  return NextResponse.json(await dataStore.getCheckouts());
}

export async function POST(request: NextRequest) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const itemId = cleanString(body.itemId);
  const assignedToName = cleanString(body.assignedToName);
  const assignedToPhone = cleanString(body.assignedToPhone);
  const assignedToEmail = cleanString(body.assignedToEmail).toLowerCase();
  const collectionNotes = cleanOptionalString(body.collectionNotes);
  const dueDate = toIsoDate(body.dueDate);

  if (
    !itemId ||
    !assignedToName ||
    !assignedToPhone ||
    !assignedToEmail ||
    !isItemCondition(body.conditionOnCollection)
  ) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const item = await dataStore.getItem(itemId);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const category = await dataStore.getCategory(item.categoryId);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const isQuantityTracked = category.trackingType === "quantity";

  if (!isQuantityTracked && item.status === "checked-out") {
    return NextResponse.json({ error: "Item is already assigned" }, { status: 409 });
  }

  if (category.returnType === "fixed-date" && !dueDate) {
    return NextResponse.json({ error: "Due date is required for this category" }, { status: 400 });
  }

  const checkoutQuantity = isQuantityTracked ? toPositiveInteger(body.quantity) : null;
  if (isQuantityTracked && checkoutQuantity === null) {
    return NextResponse.json({ error: "Quantity must be one or greater" }, { status: 400 });
  }

  if (isQuantityTracked && item.quantity === null) {
    return NextResponse.json({ error: "This item is missing stock quantity" }, { status: 409 });
  }

  if (isQuantityTracked && checkoutQuantity !== null && checkoutQuantity > item.quantity!) {
    return NextResponse.json({ error: "Not enough stock available" }, { status: 409 });
  }

  const checkout = await dataStore.createCheckout({
    itemId,
    quantity: checkoutQuantity,
    collectedBy: auth.user.name,
    assignedToName,
    assignedToPhone,
    assignedToEmail,
    conditionOnCollection: body.conditionOnCollection,
    collectionNotes,
    dateCollected: new Date().toISOString(),
    dueDate,
    dateReturned: null,
    conditionOnReturn: null,
    returnNotes: null,
    status: "active",
  });

  if (isQuantityTracked && item.quantity !== null && checkoutQuantity !== null) {
    const remaining = item.quantity - checkoutQuantity;
    const nextStatus =
      category.lowStockThreshold !== null &&
      remaining <= category.lowStockThreshold
        ? "low-stock"
        : "available";
    await dataStore.updateItem(itemId, { quantity: remaining, status: nextStatus });
  } else {
    await dataStore.updateItem(itemId, {
      status: "checked-out",
      condition: body.conditionOnCollection,
    });
  }

  return NextResponse.json(checkout, { status: 201 });
}
