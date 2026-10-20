import { cookies } from "next/headers";
import { DepartmentUser } from "@/types";
import { dataStore } from "@/lib/data";

export const SESSION_COOKIE = "inventory_user_id";
export const ROLE_COOKIE = "inventory_user_role";
export const STATUS_COOKIE = "inventory_user_status";

export async function getSession(): Promise<DepartmentUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await dataStore.getUser(userId);
  if (!user) {
    return null;
  }

  // Active users can access normally. Super-admin users may also have access
  // while their account is still onboarding, so they are not blocked here.
  // Pending users are allowed to hold a session only so they can reach the
  // forced password-change page on first login; entry to the app itself is
  // blocked separately in the app layout and API permission checks.
  if (user.status === "inactive") {
    return null;
  }

  return user;
}

export async function createSession(
  userOrId: DepartmentUser | string,
  role?: string,
  status?: string
): Promise<void> {
  const cookieStore = await cookies();
  const userId = typeof userOrId === "string" ? userOrId : userOrId.id;
  const userRole = typeof userOrId === "object" ? userOrId.role : role;
  const userStatus = typeof userOrId === "object" ? userOrId.status : status;

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };

  cookieStore.set(SESSION_COOKIE, userId, cookieOptions);
  if (userRole) {
    cookieStore.set(ROLE_COOKIE, userRole, cookieOptions);
  }
  if (userStatus) {
    cookieStore.set(STATUS_COOKIE, userStatus, cookieOptions);
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ROLE_COOKIE);
  cookieStore.delete(STATUS_COOKIE);
}

export { isTechUser, isStaffUser, getPortalRoute } from "./roles";

