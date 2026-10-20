import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { CheckoutsList } from "@/components/checkouts/CheckoutsList";
import Link from "next/link";
import { ArrowLeft, ArrowLeftRight } from "lucide-react";

export const metadata = {
  title: "Custody & Returns Management | E310 Tech Command Center",
  description: "Track equipment checkouts, return deadlines, overdue items, and extensions.",
};

export default async function TechCheckoutsPage() {
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

  const [checkouts, items, categories] = await Promise.all([
    dataStore.getCheckouts(),
    dataStore.getItems(),
    dataStore.getCategories(),
  ]);

  return (
    <AppShell admin={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/dashboard"
              className="hover:text-slate-800 transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tech Dashboard</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-slate-800">Checkouts & Returns</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                <ArrowLeftRight className="w-7 h-7 text-blue-600" />
                <span>Custody & Returns Management</span>
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Track staff hardware assignments, overdue items, due-date extensions, and return condition inspections.
              </p>
            </div>
          </div>
        </div>

        {/* Modernized Checkouts List */}
        <CheckoutsList checkouts={checkouts} items={items} categories={categories} />
      </div>
    </AppShell>
  );
}
