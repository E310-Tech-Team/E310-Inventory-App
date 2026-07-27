import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";
import {
  cleanString,
  isReturnType,
  isTrackingType,
  toNonNegativeInteger,
} from "@/lib/validation";

export async function GET() {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const categories = await dataStore.getCategories();
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const name = cleanString(body.name);
  const lowStockThreshold =
    body.lowStockThreshold === null || body.lowStockThreshold === ""
      ? null
      : toNonNegativeInteger(body.lowStockThreshold);

  if (!name || !isTrackingType(body.trackingType) || !isReturnType(body.returnType)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  if (body.trackingType === "quantity" && lowStockThreshold === null && body.lowStockThreshold) {
    return NextResponse.json(
      { error: "Low stock threshold must be zero or greater" },
      { status: 400 }
    );
  }

  const category = await dataStore.createCategory({
    name,
    trackingType: body.trackingType,
    returnType: body.returnType,
    lowStockThreshold: body.trackingType === "quantity" ? lowStockThreshold : null,
    createdBy: auth.user.name,
  });

  return NextResponse.json(category, { status: 201 });
}
