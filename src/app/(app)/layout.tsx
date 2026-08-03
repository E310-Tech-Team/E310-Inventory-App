import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
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

  return <AppShell admin={admin}>{children}</AppShell>;
}
