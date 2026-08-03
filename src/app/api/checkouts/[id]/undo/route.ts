import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const checkout = await dataStore.getCheckout(id);
  if (!checkout) {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }

  if (checkout.status !== "returned") {
    return NextResponse.json({ error: "Checkout is not currently returned" }, { status: 409 });
  }

  const item = await dataStore.getItem(checkout.itemId);
  const updatedCheckout = await dataStore.updateCheckout(id, {
    dateReturned: null,
    conditionOnReturn: null,
    returnNotes: null,
    status: "active",
  });

  if (item) {
    if (item.quantity !== null && checkout.quantity !== null) {
      const category = await dataStore.getCategory(item.categoryId);
      const nextQuantity = Math.max(0, item.quantity - checkout.quantity);
      const nextStatus =
        category?.lowStockThreshold !== null &&
        category?.lowStockThreshold !== undefined &&
        nextQuantity <= category.lowStockThreshold
          ? "low-stock"
          : "available";
      await dataStore.updateItem(item.id, {
        quantity: nextQuantity,
        status: nextStatus,
      });
    } else {
      await dataStore.updateItem(item.id, {
        status: "checked-out",
        condition: checkout.conditionOnCollection,
      });
    }
  }

  return NextResponse.json(updatedCheckout);
}
