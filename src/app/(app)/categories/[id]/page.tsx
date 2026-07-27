import { notFound } from "next/navigation";
import { CategoryDetailView } from "@/components/categories/CategoryDetailView";
import { dataStore } from "@/lib/data";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, items, checkouts] = await Promise.all([
    dataStore.getCategory(id),
    dataStore.getItemsByCategory(id),
    dataStore.getCheckouts(),
  ]);

  if (!category) {
    notFound();
  }

  return <CategoryDetailView category={category} items={items} checkouts={checkouts} />;
}
