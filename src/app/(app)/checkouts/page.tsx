import { dataStore } from "@/lib/data";
import { CheckoutsList } from "@/components/checkouts/CheckoutsList";
import { ArrowLeftRight } from "lucide-react";

export const metadata = {
  title: "Checkouts & Loans | E310",
  description: "Track equipment checkouts, return deadlines, overdue items, and extensions.",
};

export default async function CheckoutsPage() {
  const [checkouts, items, categories] = await Promise.all([
    dataStore.getCheckouts(),
    dataStore.getItems(),
    dataStore.getCategories(),
  ]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
          <ArrowLeftRight className="w-6 h-6 text-brand-teal" />
          <span>Checkouts & Assigned Equipment</span>
        </h1>
        <p className="text-sm text-muted">
          Active equipment assignments, custody records, return deadlines, and condition tracking.
        </p>
      </div>

      <CheckoutsList checkouts={checkouts} items={items} categories={categories} />
    </div>
  );
}
