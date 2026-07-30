import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/auth/permissions";
import { dataStore } from "@/lib/data";
import { cleanString, isUserRole, isUserStatus } from "@/lib/validation";

async function isLastActiveSuperAdmin(userId: string): Promise<boolean> {
  const users = await dataStore.getUsers();
  const activeSuperAdmins = users.filter(
    (user) => user.role === "super-admin" && user.status === "active"
  );

  return activeSuperAdmins.length === 1 && activeSuperAdmins[0]?.id === userId;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const target = await dataStore.getUser(id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = (await request.json()) as Record<string, unknown>;
  const name = body.name !== undefined ? cleanString(body.name) : undefined;
  const email =
    body.email !== undefined ? cleanString(body.email).toLowerCase() : undefined;
  const nextRole = isUserRole(body.role) ? body.role : target.role;
  const nextStatus = isUserStatus(body.status) ? body.status : target.status;

  if (name !== undefined && name.length === 0) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (email !== undefined && email.length === 0) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  if (email && email !== target.email.toLowerCase()) {
    const existing = await dataStore.getUserByEmail(email);
    if (existing && existing.id !== id) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }
  }

  const removesOwnSuperAdminAccess =
    id === auth.user.id && (nextRole !== "super-admin" || nextStatus !== "active");
  if (removesOwnSuperAdminAccess) {
    return NextResponse.json(
      { error: "Another super-admin must change your role or access status" },
      { status: 409 }
    );
  }

  const removesLastSuperAdmin =
    target.role === "super-admin" &&
    target.status === "active" &&
    (nextRole !== "super-admin" || nextStatus !== "active") &&
    (await isLastActiveSuperAdmin(id));
  if (removesLastSuperAdmin) {
    return NextResponse.json(
      { error: "At least one active super-admin is required" },
      { status: 409 }
    );
  }

  try {
    const updated = await dataStore.updateUser(id, {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(isUserRole(body.role) ? { role: nextRole } : {}),
      ...(isUserStatus(body.status) ? { status: nextStatus } : {}),
    });
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Couldn't update user" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  if (id === auth.user.id) {
    return NextResponse.json(
      { error: "Another super-admin must remove your access" },
      { status: 409 }
    );
  }

  const target = await dataStore.getUser(id);
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (
    target.role === "super-admin" &&
    target.status === "active" &&
    (await isLastActiveSuperAdmin(id))
  ) {
    return NextResponse.json(
      { error: "At least one active super-admin is required" },
      { status: 409 }
    );
  }

  try {
    await dataStore.deleteUser(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete user", error);
    return NextResponse.json(
      { error: "Couldn't remove access. Try again or check Supabase permissions." },
      { status: 500 }
    );
  }
}
