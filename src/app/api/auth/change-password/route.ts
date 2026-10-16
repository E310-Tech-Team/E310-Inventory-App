import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { dataStore } from "@/lib/data";

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const currentPassword = typeof body.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

  if (!newPassword) {
    return NextResponse.json({ error: "A new password is required" }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (!user.passwordHash) {
    return NextResponse.json(
      { error: "This account has no password set. Contact an administrator." },
      { status: 400 }
    );
  }

  const isPendingUser = user.status === "pending";
  if (!isPendingUser && (!currentPassword || !verifyPassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const passwordHash = hashPassword(newPassword);

  try {
    await dataStore.updateUser(user.id, { passwordHash, status: "active" });
    const isTech = user.role === "super-admin" || user.role === "team-member";
    return NextResponse.json({
      success: true,
      redirectUrl: isTech ? "/tech" : "/staff",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to change password" },
      { status: 400 }
    );
  }
}
