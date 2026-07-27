import { dataStore } from "@/lib/data";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default async function DashboardPage() {
  const [categories, items, checkouts] = await Promise.all([
    dataStore.getCategories(),
    dataStore.getItems(),
    dataStore.getCheckouts(),
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
    />
  );
}
