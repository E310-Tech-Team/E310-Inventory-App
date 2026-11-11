import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { ItemsList } from "@/components/items/ItemsList";

export const metadata = {
  title: "Inventory Catalog | E310 Tech Ops",
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
      <ItemsList items={items} categories={categories} />
    </AppShell>
  );
}
