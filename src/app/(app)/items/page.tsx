import { dataStore } from "@/lib/data";
import { ItemsList } from "@/components/items/ItemsList";

export const metadata = {
  title: "Inventory & Asset Catalog | E310",
  description: "Browse, filter, and manage all company hardware assets and inventory.",
};

export default async function ItemsPage() {
  const [items, categories] = await Promise.all([
    dataStore.getItems(),
    dataStore.getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Equipment & Asset Catalog
        </h1>
        <p className="text-sm text-slate-500">
          Complete inventory registry of all company-owned hardware, computing devices, and tracked equipment.
        </p>
      </div>

      <ItemsList items={items} categories={categories} />
    </div>
  );
}
