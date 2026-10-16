import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { TechDashboard } from "@/components/tech/TechDashboard";

export default async function TechPortalRoot() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  // Enforce role barrier: staff accounts are blocked from tech portal
  if (!isTechUser(user)) {
    redirect("/staff");
  }

  return (
    <AppShell admin={user}>
      <TechDashboard admin={user} />
    </AppShell>
  );
}
