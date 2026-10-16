import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getPortalRoute, getSession } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  // Active users do not need the forced password-change flow.
  // Direct them straight to their respective portal.
  if (user.status === "active") {
    redirect(getPortalRoute(user));
  }

  return <ChangePasswordForm />;
}
