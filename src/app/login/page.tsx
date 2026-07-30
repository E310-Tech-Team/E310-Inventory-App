import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";
import { DepartmentUser } from "@/types";

export default async function LoginPage() {
  const user = await getSession();

  if (user) {
    redirect("/dashboard");
  }

  let users: DepartmentUser[] = [];
  let setupError: string | null = null;

  try {
    users = await dataStore.getActiveUsers();
  } catch (error) {
    console.error("Failed to load active users for login", error);
    setupError = "Access list could not be loaded. Check deployment database settings.";
  }

  return <LoginForm users={users} setupError={setupError} />;
}
