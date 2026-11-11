import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { StaffDevice } from "@/types";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { DevicesViewClient } from "./DevicesViewClient";

export default async function StaffDevicesPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  let initialDevices: StaffDevice[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdminClient();
      const { data: checkoutRows } = await supabase
        .from("checkouts")
        .select(`
          id,
          item_id,
          date_collected,
          due_date,
          status,
          item:items (
            id,
            name,
            serial_number,
            identifier_type,
            identifier_value,
            condition,
            category:categories (
              name
            )
          )
        `)
        .ilike("assigned_to_email", user.email)
        .in("status", ["active", "overdue"])
        .order("date_collected", { ascending: false });

      if (checkoutRows) {
        initialDevices = checkoutRows
          .filter((row: any) => row.item)
          .map((row: any) => ({
            checkoutId: row.id,
            itemId: row.item_id,
            name: row.item?.name ?? "Hardware Device",
            categoryName: row.item?.category?.name ?? "General Equipment",
            serialNumber: row.item?.serial_number ?? null,
            identifierType: row.item?.identifier_type ?? null,
            identifierValue: row.item?.identifier_value ?? null,
            condition: row.item?.condition ?? "good",
            dateCollected: row.date_collected,
            dueDate: row.due_date,
            status: row.status,
          }));
      }
    } catch (err) {
      console.warn("Could not load devices during SSR:", err);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <StaffHeader user={user} activePath="/staff/devices" />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-7 pb-8">
        <DevicesViewClient initialDevices={initialDevices} />
      </main>
    </div>
  );
}
