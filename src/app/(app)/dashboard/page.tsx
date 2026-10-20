import { dataStore } from "@/lib/data";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const [categories, items, checkouts, user] = await Promise.all([
    dataStore.getCategories(),
    dataStore.getItems(),
    dataStore.getCheckouts(),
    getSession(),
  ]);

  // This is a Server Component; Date.now() here reflects request time, not render-time state.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  return (
    <DashboardView
      categories={categories}
      items={items}
      checkouts={checkouts}
      now={now}
      user={user}
    />
  );
}
