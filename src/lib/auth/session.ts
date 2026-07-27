import { cookies } from "next/headers";
import { DepartmentUser } from "@/types";
import { dataStore } from "@/lib/data";

const SESSION_COOKIE = "inventory_user_id";

export async function getSession(): Promise<DepartmentUser | null> {
  const cookieStore = await cookies();
  const userId = cookieStore.get(SESSION_COOKIE)?.value;
  if (!userId) return null;

  const user = await dataStore.getUser(userId);
  if (!user || user.status !== "active") {
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
