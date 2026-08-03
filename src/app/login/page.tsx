import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getSession();

  if (user) {
    // Super-admins are trusted bootstrap users and never need the forced
    // password-change flow. Regular pending users are sent to change-password.
    const isSuperAdmin = user.role === "super-admin";
    redirect(!isSuperAdmin && user.status === "pending" ? "/change-password" : "/dashboard");
  }

  return <LoginForm />;
}
