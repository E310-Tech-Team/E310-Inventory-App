import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { ItemsList } from "@/components/items/ItemsList";
import Link from "next/link";
import { ArrowLeft, Package } from "lucide-react";

export const metadata = {
  title: "Inventory & Asset Catalog | E310 Tech Command Center",
  description: "Browse, search, and manage all physical equipment across departments.",
};

export default async function TechItemsPage() {
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

  const [items, categories] = await Promise.all([
    dataStore.getItems(),
    dataStore.getCategories(),
  ]);

  return (
    <AppShell admin={user}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Link
              href="/dashboard"
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Tech Dashboard</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-foreground">Inventory Catalog</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
                <Package className="w-7 h-7 text-brand-teal" />
                <span>Inventory & Asset Catalog</span>
              </h1>
              <p className="mt-1 text-sm text-muted">
                Complete registry of company hardware, computing assets, and stock supplies with multi-attribute filtering.
              </p>
            </div>
          </div>
        </div>

        {/* Modernized Items List */}
        <ItemsList items={items} categories={categories} />
      </div>
    </AppShell>
  );
}
