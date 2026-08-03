import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dataStore } from "@/lib/data";
import { cleanString, isUserRole, isUserStatus } from "@/lib/validation";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";

export async function GET() {
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  return NextResponse.json(await dataStore.getUsers());
}

export async function POST(request: NextRequest) {
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const body = (await request.json()) as Record<string, unknown>;
  const name = cleanString(body.name);
  const email = cleanString(body.email).toLowerCase();
  const role = isUserRole(body.role) ? body.role : "team-member";
  const status = isUserStatus(body.status) ? body.status : "pending";

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  const existing = await dataStore.getUserByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  let temporaryPassword: string | null = null;
  let passwordHash: string | undefined;
  if (status === "pending") {
    temporaryPassword = generateTemporaryPassword();
    passwordHash = hashPassword(temporaryPassword);
  }

  try {
    const user = await dataStore.createUser({
      name,
      email,
      role,
      status,
      invitedBy: auth.user.name,
      passwordHash,
    });

    return NextResponse.json(
      {
        ...user,
        temporaryPassword: status === "active" ? temporaryPassword : undefined,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't create user" },
      { status: 400 }
    );
  }
}
