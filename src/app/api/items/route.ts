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

export async function GET(request: NextRequest) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const categoryId = request.nextUrl.searchParams.get("categoryId");

  const items = categoryId
    ? await dataStore.getItemsByCategory(categoryId)
    : await dataStore.getItems();

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const categoryId = cleanString(body.categoryId);
  const name = cleanString(body.name);
  const identifierValue = cleanOptionalString(body.identifierValue ?? body.serialNumber);
  const identifierType = isItemIdentifierType(body.identifierType)
    ? body.identifierType
    : identifierValue
      ? "serial-number"
      : null;
  const quantity = toNonNegativeInteger(body.quantity);
  const condition = isItemCondition(body.condition) ? body.condition : "new";
  const notes = cleanOptionalString(body.notes);

  if (!categoryId || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const category = await dataStore.getCategory(categoryId);
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const isQuantityTracked = category.trackingType === "quantity";
  if (isQuantityTracked && quantity === null) {
    return NextResponse.json({ error: "Quantity must be zero or greater" }, { status: 400 });
  }

  const status =
    isQuantityTracked &&
    category.lowStockThreshold !== null &&
    quantity !== null &&
    quantity <= category.lowStockThreshold
      ? "low-stock"
      : "available";

  const item = await dataStore.createItem({
    categoryId,
    name,
    serialNumber:
      !isQuantityTracked && identifierType === "serial-number" ? identifierValue : null,
    identifierType: isQuantityTracked ? null : identifierType,
    identifierValue: isQuantityTracked ? null : identifierValue,
    quantity: isQuantityTracked ? quantity : null,
    status,
    condition,
    notes,
  });

  return NextResponse.json(item, { status: 201 });
}
