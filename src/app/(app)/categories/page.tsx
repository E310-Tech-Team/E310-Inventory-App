import { dataStore } from "@/lib/data";
import { CategoriesList } from "@/components/categories/CategoriesList";

export default async function CategoriesPage() {
  const [categories, items] = await Promise.all([
    dataStore.getCategories(),
    dataStore.getItems(),
  ]);

  return <CategoriesList categories={categories} items={items} />;
}
