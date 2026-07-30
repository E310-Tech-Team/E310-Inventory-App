import { notFound, redirect } from "next/navigation";
import { CategoryDetailView } from "@/components/categories/CategoryDetailView";
import { dataStore } from "@/lib/data";
import { getSession } from "@/lib/auth/session";

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [category, items, checkouts, assigners, currentAdmin] = await Promise.all([
    dataStore.getCategory(id),
    dataStore.getItemsByCategory(id),
    dataStore.getCheckouts(),
    dataStore.getActiveUsers(),
    getSession(),
  ]);

  if (!category) {
    notFound();
  }

  if (!currentAdmin) {
    redirect("/login");
  }

  return (
    <CategoryDetailView
      category={category}
      items={items}
      checkouts={checkouts}
      assigners={assigners}
      currentAdmin={currentAdmin}
    />
  );
}
