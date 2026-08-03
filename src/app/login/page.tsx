import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";

export default async function LoginPage() {
  const user = await getSession();

  if (user) {
    redirect(user.status === "pending" ? "/change-password" : "/dashboard");
  }

  return <LoginForm />;
}
