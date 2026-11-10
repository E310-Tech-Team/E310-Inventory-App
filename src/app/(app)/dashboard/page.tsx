import { dataStore } from "@/lib/data";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { getSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  const [categories, items, checkouts, complaints, user] = await Promise.all([
    dataStore.getCategories(),
    dataStore.getItems(),
    dataStore.getCheckouts(),
    dataStore.getComplaints().catch(() => []),
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
      complaints={complaints}
      now={now}
      user={user}
    />
  );
}
