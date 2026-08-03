import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getSession } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  // Super-admins are trusted bootstrap users and never need the forced
  // password-change flow. Send them straight to the dashboard.
  if (user.role === "super-admin" || user.status === "active") {
    redirect("/dashboard");
  }

  return <ChangePasswordForm />;
}
