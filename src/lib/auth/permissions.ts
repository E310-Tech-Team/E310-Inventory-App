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
