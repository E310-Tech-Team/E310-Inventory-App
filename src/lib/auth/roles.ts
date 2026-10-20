import { DepartmentUser } from "@/types";

export function isTechUser(user?: DepartmentUser | null): boolean {
  if (!user) return false;
  return (
    user.role === "super-admin" ||
    user.role === "tech-support" ||
    user.role === "team-member"
  );
}

export function isStaffUser(user?: DepartmentUser | null): boolean {
  return !isTechUser(user);
}

export function getPortalRoute(user: DepartmentUser): string {
  if (user.status === "pending") {
    return "/change-password";
  }
  return isTechUser(user) ? "/tech" : "/staff";
}
