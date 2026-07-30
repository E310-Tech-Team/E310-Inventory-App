import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { dataStore } from "@/lib/data";

const DEFAULT_SUPER_ADMIN_PASSWORD =
  process.env.SUPER_ADMIN_DEFAULT_PASSWORD ?? "InventoryAppSuperAdmin@2026";
const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL ?? "goodnessezekiel@theincubatorhub.org";

export async function POST(request: NextRequest) {
  const { email, password } = await request.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (!password || typeof password !== "string") {
    return NextResponse.json({ error: "Password is required" }, { status: 400 });
  }

  let user = await dataStore.getUserByEmail(email.trim().toLowerCase());

  if (!user && email.trim().toLowerCase() === SUPER_ADMIN_EMAIL) {
    if (password === DEFAULT_SUPER_ADMIN_PASSWORD) {
      try {
        user = await dataStore.createUser({
          name: "Super Admin",
          email: SUPER_ADMIN_EMAIL,
          role: "super-admin",
          status: "active",
          invitedBy: null,
          passwordHash: null,
        });
      } catch (error) {
        return NextResponse.json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unable to create super-admin account. Check your Supabase schema and connection.",
          },
          { status: 500 }
        );
      }
    }
  }

  if (!user || (user.status !== "active" && user.role !== "super-admin")) {
    return NextResponse.json(
      { error: "No active access for this email. Set your password on the sign-up page if needed." },
      { status: 403 }
    );
  }

  const canUseDefaultSuperAdminPassword =
    user.role === "super-admin" &&
    !user.passwordHash &&
    password === DEFAULT_SUPER_ADMIN_PASSWORD;

  if (!user.passwordHash) {
    if (!canUseDefaultSuperAdminPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
  } else if (!verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ success: true });
}
