import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";

export default async function LoginPage() {
  const user = await getSession();

  if (user) {
    redirect("/dashboard");
  }

  const users = await dataStore.getActiveUsers();

  return <LoginForm users={users} />;
}
