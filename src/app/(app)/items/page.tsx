import { dataStore } from "@/lib/data";
import { ItemsList } from "@/components/items/ItemsList";

export const metadata = {
  title: "Inventory Catalog | E310",
  description: "Browse, filter, and manage all company hardware assets and inventory.",
};

export default async function ItemsPage() {
  const [items, categories] = await Promise.all([
    dataStore.getItems(),
    dataStore.getCategories(),
  ]);

  return <ItemsList items={items} categories={categories} />;
}
