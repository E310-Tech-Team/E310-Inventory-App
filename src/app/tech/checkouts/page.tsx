import { redirect } from "next/navigation";
import { getSession, isTechUser } from "@/lib/auth/session";
import { dataStore } from "@/lib/data";
import { AppShell } from "@/components/layout/AppShell";
import { CheckoutsList } from "@/components/checkouts/CheckoutsList";

export const metadata = {
  title: "Checkouts & Loans | E310 Tech Ops",
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
      <CheckoutsList
        checkouts={checkouts}
        items={items}
        categories={categories}
      />
    </AppShell>
  );
}
