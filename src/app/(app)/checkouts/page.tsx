import { dataStore } from "@/lib/data";
import { CheckoutsList } from "@/components/checkouts/CheckoutsList";

export default async function CheckoutsPage() {
  const [checkouts, items, categories] = await Promise.all([
    dataStore.getCheckouts(),
    dataStore.getItems(),
    dataStore.getCategories(),
  ]);

  return <CheckoutsList checkouts={checkouts} items={items} categories={categories} />;
}
