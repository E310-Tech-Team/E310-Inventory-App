import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { dataStore } from "@/lib/data";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  const user = await dataStore.getUserByEmail(email.trim().toLowerCase());
  if (!user || user.status !== "active" || !user.passwordHash) {
    return NextResponse.json(
      { error: "No active access for this email. Set your password on the sign-up page if needed." },
      { status: 403 }
    );
  }

  if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
