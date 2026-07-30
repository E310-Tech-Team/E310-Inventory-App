import { dataStore } from "@/lib/data";
import { ExportsView } from "@/components/exports/ExportsView";

export default async function ExportsPage() {
  const categories = await dataStore.getCategories();

  return <ExportsView categories={categories} />;
}
