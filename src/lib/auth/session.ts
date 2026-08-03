import { cookies } from "next/headers";
import { DepartmentUser } from "@/types";
import { dataStore } from "@/lib/data";

const SESSION_COOKIE = "inventory_user_id";

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

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}
