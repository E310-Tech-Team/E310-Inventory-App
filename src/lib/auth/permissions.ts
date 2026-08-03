import { NextResponse } from "next/server";
import { DepartmentUser } from "@/types";
import { getSession } from "./session";

export type AuthResult =
  | { user: DepartmentUser; response?: never }
  | { user?: never; response: NextResponse };

export async function requireActiveUser(): Promise<AuthResult> {
  const user = await getSession();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // Pending users may hold a session only to reach the forced password-change
  // page. They must not be able to call protected APIs until their permanent
  // password is set (status becomes active).
  if (user.status !== "active" && user.role !== "super-admin") {
    return {
      response: NextResponse.json({ error: "Set your password to continue" }, { status: 403 }),
    };
  }

  return { user };
}

export async function requireSuperAdmin(): Promise<AuthResult> {
  const result = await requireActiveUser();

  if ("response" in result) {
    return result;
  }

  if (result.user.role !== "super-admin") {
    return {
      response: NextResponse.json({ error: "Super-admin access required" }, { status: 403 }),
    };
  }

  return result;
}

export function isSuperAdmin(user: DepartmentUser): boolean {
  return user.role === "super-admin";
}

function normalizeOwnerName(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

export function canEditInventoryRecord(user: DepartmentUser, ownerName: string | null | undefined): boolean {
  if (isSuperAdmin(user)) {
    return true;
  }

  const normalizedUserName = normalizeOwnerName(user.name);
  const normalizedOwnerName = normalizeOwnerName(ownerName);

  if (!normalizedUserName || !normalizedOwnerName) {
    return false;
  }

  return normalizedUserName === normalizedOwnerName;
}

export async function requireInventoryOwnerAccess(
  ownerName: string | null | undefined
): Promise<AuthResult> {
  const auth = await requireActiveUser();
  if ("response" in auth) {
    return auth;
  }

  if (!canEditInventoryRecord(auth.user, ownerName)) {
    return {
      response: NextResponse.json(
        { error: "You can only edit records you created." },
        { status: 403 }
      ),
    };
  }

  return auth;
}
