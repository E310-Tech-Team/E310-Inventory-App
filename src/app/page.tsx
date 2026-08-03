import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { HomePage } from "@/components/home/HomePage";

export default async function RootPage() {
  const admin = await getSession();

  if (!admin) {
    redirect("/login");
  }

  return (
    <AppShell admin={admin}>
      <HomePage admin={admin} />
    </AppShell>
  );
}
