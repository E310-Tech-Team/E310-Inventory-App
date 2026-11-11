import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { OptionsManager } from "@/components/tech/OptionsManager";

export const metadata = {
  title: "Form Options | E310 Tech Ops",
  description:
    "Manage approved device brands, hardware types, ticket issue categories, and departments.",
};

export default async function TechOptionsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  if (!isTechUser(user)) {
    redirect("/staff");
  }

  return (
    <AppShell admin={user}>
      <PageHeader
        title="Form Options"
        description="Manage approved device brands, hardware types, ticket issue categories, and departments."
      />
      <div className="px-4 md:px-8 pb-12">
        <OptionsManager />
      </div>
    </AppShell>
  );
}
