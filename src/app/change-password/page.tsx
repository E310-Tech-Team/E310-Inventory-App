import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/ChangePasswordForm";
import { getSession } from "@/lib/auth/session";

export default async function ChangePasswordPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "active") {
    redirect("/dashboard");
  }

  return <ChangePasswordForm />;
}
