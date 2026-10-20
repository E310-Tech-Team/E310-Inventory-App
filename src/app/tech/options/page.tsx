import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { AppShell } from "@/components/layout/AppShell";
import { OptionsManager } from "@/components/tech/OptionsManager";
import { Sliders } from "lucide-react";

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
      <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8 text-foreground">
        <div className="mx-auto max-w-5xl space-y-8">
          {/* Header */}
          <div className="pb-6 border-b border-border">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-surface-elevated border border-border text-muted text-xs font-semibold uppercase tracking-wider mb-2">
              <Sliders className="w-3.5 h-3.5 text-brand-teal" />
              Dynamic System Options
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Form Options & Category Groups
            </h1>
            <p className="mt-1 text-sm text-muted">
              Manage approved device brands, hardware types, ticket issue categories, and departments across the platform.
            </p>
          </div>

          {/* Options Manager */}
          <OptionsManager />
        </div>
      </div>
    </AppShell>
  );
}
