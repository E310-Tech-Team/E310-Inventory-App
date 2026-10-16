import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getSession();

  if (!admin) {
    redirect("/login");
  }

  if (admin.status === "pending") {
    redirect("/change-password");
  }

  // Staff members are restricted to the Staff Portal
  if (!isTechUser(admin)) {
    redirect("/staff");
  }

  return <AppShell admin={admin}>{children}</AppShell>;
}
