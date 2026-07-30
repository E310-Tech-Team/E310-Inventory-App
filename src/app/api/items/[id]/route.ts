import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";
import {
  cleanOptionalString,
  cleanString,
  isItemIdentifierType,
  isItemCondition,
  toNonNegativeInteger,
} from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const item = await dataStore.getItem(id);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const existing = await dataStore.getItem(id);
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const category = await dataStore.getCategory(existing.categoryId);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const quantity =
    body.quantity === undefined || body.quantity === null || body.quantity === ""
      ? null
      : toNonNegativeInteger(body.quantity);

  if (body.name !== undefined && !cleanString(body.name)) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (body.condition !== undefined && !isItemCondition(body.condition)) {
    return NextResponse.json({ error: "Invalid condition" }, { status: 400 });
  }
  if (category.trackingType === "quantity" && body.quantity !== undefined && quantity === null) {
    return NextResponse.json({ error: "Quantity must be zero or greater" }, { status: 400 });
  }

  const identifierValue =
    body.identifierValue !== undefined || body.serialNumber !== undefined
      ? cleanOptionalString(body.identifierValue ?? body.serialNumber)
      : undefined;
  const identifierType =
    body.identifierType !== undefined
      ? isItemIdentifierType(body.identifierType)
        ? body.identifierType
        : null
      : undefined;

  if (body.identifierType !== undefined && identifierType === null) {
    return NextResponse.json({ error: "Invalid identifier type" }, { status: 400 });
  }

  const update = {
    ...(body.name !== undefined ? { name: cleanString(body.name) } : {}),
    ...(category.trackingType === "individual" &&
    (identifierValue !== undefined || identifierType !== undefined)
      ? {
          serialNumber:
            (identifierType ?? existing.identifierType) === "serial-number"
              ? identifierValue !== undefined
                ? identifierValue
                : existing.identifierValue
              : null,
          identifierType:
            identifierType ?? (identifierValue ? existing.identifierType ?? "serial-number" : null),
          identifierValue:
            identifierValue !== undefined ? identifierValue : existing.identifierValue,
          quantity: null,
        }
      : {}),
    ...(category.trackingType === "quantity" && body.quantity !== undefined
      ? { serialNumber: null, identifierType: null, identifierValue: null, quantity }
      : {}),
    ...(isItemCondition(body.condition) ? { condition: body.condition } : {}),
    ...(body.notes !== undefined ? { notes: cleanOptionalString(body.notes) } : {}),
  };

  try {
    const item = await dataStore.updateItem(id, update);

    if (
      category?.trackingType === "quantity" &&
      category.lowStockThreshold !== null &&
      item.quantity !== null &&
      item.status !== "checked-out"
    ) {
      const nextStatus = item.quantity <= category.lowStockThreshold ? "low-stock" : "available";
      if (nextStatus !== item.status) {
        const updated = await dataStore.updateItem(id, { status: nextStatus });
        return NextResponse.json(updated);
      }
    }

    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  try {
    await dataStore.deleteItem(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete item", error);
    return NextResponse.json(
      { error: "Couldn't delete item. Try again or check Supabase permissions." },
      { status: 500 }
    );
  }
}
