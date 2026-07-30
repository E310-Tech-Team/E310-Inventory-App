import { NextRequest, NextResponse } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { dataStore } from "@/lib/data";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Record<string, unknown>;
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const temporaryPassword = typeof body.temporaryPassword === "string" ? body.temporaryPassword : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and new password are required" }, { status: 400 });
  }

  const user = await dataStore.getUserByEmail(email);
  if (!user) {
    return NextResponse.json({ error: "No invited user found with this email" }, { status: 404 });
  }

  if (user.status !== "pending") {
    return NextResponse.json({ error: "This account cannot create a password at this time" }, { status: 403 });
  }

  if (user.passwordHash) {
    if (!temporaryPassword) {
      return NextResponse.json(
        { error: "Temporary password is required to complete signup" },
        { status: 400 }
      );
    }

    if (!verifyPassword(temporaryPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Invalid temporary password" }, { status: 401 });
    }
  }

  const passwordHash = hashPassword(password);

  try {
    await dataStore.updateUser(user.id, { passwordHash, status: "active" });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to set password" },
      { status: 400 }
    );
  }
}
