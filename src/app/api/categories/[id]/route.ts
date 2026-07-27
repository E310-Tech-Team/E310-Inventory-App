import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";
import { Category } from "@/types";
import {
  cleanString,
  isReturnType,
  isTrackingType,
  toNonNegativeInteger,
} from "@/lib/validation";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const category = await dataStore.getCategory(id);

  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  return NextResponse.json(category);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const update: Partial<Category> = {
    ...(body.name !== undefined ? { name: cleanString(body.name) } : {}),
    ...(isTrackingType(body.trackingType) ? { trackingType: body.trackingType } : {}),
    ...(isReturnType(body.returnType) ? { returnType: body.returnType } : {}),
    ...(body.lowStockThreshold !== undefined
      ? {
          lowStockThreshold:
            body.lowStockThreshold === null || body.lowStockThreshold === ""
              ? null
              : toNonNegativeInteger(body.lowStockThreshold),
        }
      : {}),
  };

  if (update.name !== undefined && update.name.length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (body.trackingType !== undefined && !isTrackingType(body.trackingType)) {
    return NextResponse.json({ error: "Invalid tracking type" }, { status: 400 });
  }
  if (body.returnType !== undefined && !isReturnType(body.returnType)) {
    return NextResponse.json({ error: "Invalid return type" }, { status: 400 });
  }
  if (
    body.lowStockThreshold !== undefined &&
    body.lowStockThreshold !== null &&
    body.lowStockThreshold !== "" &&
    update.lowStockThreshold === null
  ) {
    return NextResponse.json(
      { error: "Low stock threshold must be zero or greater" },
      { status: 400 }
    );
  }

  try {
    const category = await dataStore.updateCategory(id, update);
    return NextResponse.json(category);
  } catch {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  await dataStore.deleteCategory(id);
  return NextResponse.json({ success: true });
}
