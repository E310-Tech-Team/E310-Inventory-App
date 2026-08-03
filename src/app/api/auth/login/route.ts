import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { dataStore } from "@/lib/data";
import { hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Authentication service is not configured. Please contact the administrator." },
        { status: 500 }
      );
    }

    const { email, password } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (password !== undefined && typeof password !== "string") {
      return NextResponse.json({ error: "Password must be a string" }, { status: 400 });
    }

    const user = await dataStore.getUserByEmail(email.trim().toLowerCase());
    if (!user) {
      return NextResponse.json(
        { error: "No active access for this email. Ask an admin to validate your email." },
        { status: 403 }
      );
    }

    // Super-admins and bootstrap accounts without a password hash can sign in
    // directly. Onboarded users still need their temporary password once.
    const passwordlessAccess = user.role === "super-admin" || (user.status === "active" && !user.passwordHash);
    if (passwordlessAccess) {
      await createSession(user.id);
      return NextResponse.json({ success: true, isPasswordless: true });
    }

    if (user.status === "inactive" || !user.passwordHash) {
      return NextResponse.json(
        { error: "No active access for this email. Ask an admin to validate your email." },
        { status: 403 }
      );
    }

    if (typeof password !== "string" || password.trim().length === 0) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    let passwordValid = false;
    try {
      passwordValid = verifyPassword(password, user.passwordHash);
    } catch {
      passwordValid = false;
    }

    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    await createSession(user.id);

    // Pending users are signing in with their temporary password for the first
    // time. They are allowed to hold a session only to reach the forced
    // password-change page, where they'll set a permanent password.
    const mustChangePassword = user.status === "pending";

    return NextResponse.json({ success: true, mustChangePassword });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json(
      { error: "Unable to sign in right now. Please try again." },
      { status: 500 }
    );
  }
}
