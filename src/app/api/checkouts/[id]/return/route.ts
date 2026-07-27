import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";
import { cleanOptionalString, isItemCondition } from "@/lib/validation";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const returnNotes = cleanOptionalString(body.returnNotes);

  if (!isItemCondition(body.conditionOnReturn)) {
    return NextResponse.json({ error: "Condition is required" }, { status: 400 });
  }

  const checkout = await dataStore.getCheckout(id);
  if (!checkout) {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }
  if (checkout.status === "returned") {
    return NextResponse.json({ error: "Already returned" }, { status: 409 });
  }

  const updatedCheckout = await dataStore.updateCheckout(id, {
    dateReturned: new Date().toISOString(),
    conditionOnReturn: body.conditionOnReturn,
    returnNotes,
    status: "returned",
  });

  const item = await dataStore.getItem(checkout.itemId);
  if (item) {
    if (item.quantity !== null && checkout.quantity !== null) {
      const category = await dataStore.getCategory(item.categoryId);
      const restored = item.quantity + checkout.quantity;
      const nextStatus =
        category?.lowStockThreshold !== null &&
        category?.lowStockThreshold !== undefined &&
        restored <= category.lowStockThreshold
          ? "low-stock"
          : "available";
      await dataStore.updateItem(item.id, { quantity: restored, status: nextStatus });
    } else {
      await dataStore.updateItem(item.id, { status: "available", condition: body.conditionOnReturn });
    }
  }

  return NextResponse.json(updatedCheckout);
}
