import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";

export async function POST(request: NextRequest) {
  const { email } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const user = await dataStore.getUserByEmail(email.trim().toLowerCase());
  if (!user || user.status !== "active") {
    return NextResponse.json({ error: "No active access for this email" }, { status: 403 });
  }

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
