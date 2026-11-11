import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dataStore } from "@/lib/data";
import { cleanOptionalString, cleanString, isUserRole, isUserStatus } from "@/lib/validation";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";
import { formatStaffId, isValidStaffId } from "@/lib/staff-id";

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
  const rawStaffId = cleanOptionalString(body.staffId);
  const staffId = rawStaffId ? formatStaffId(rawStaffId) : undefined;
  const department = cleanOptionalString(body.department);

  if (staffId && !isValidStaffId(staffId)) {
    return NextResponse.json(
      { error: "Staff ID must follow the E310-002 format (e.g. E310-001, E310-002)." },
      { status: 400 }
    );
  }

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  if (!email.endsWith("@r4cglobal.org")) {
    return NextResponse.json(
      { error: "Access restricted. Only @r4cglobal.org email addresses are permitted." },
      { status: 400 }
    );
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
      staffId,
      department,
      passwordHash,
    });

    return NextResponse.json(
      {
        ...user,
        temporaryPassword: temporaryPassword ?? undefined,
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
