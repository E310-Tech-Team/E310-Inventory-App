import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { StaffDevice } from "@/types";
import { E310Logo } from "@/components/common/E310Logo";
import { RoleContextBadge } from "@/components/common/RoleContextBadge";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { DevicesViewClient } from "./DevicesViewClient";
import { ArrowLeft, LogOut } from "lucide-react";

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
    <div className="min-h-screen bg-canvas text-foreground">
      {/* Top Header */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md px-6 py-3 sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/staff" className="flex items-center gap-2 text-xs text-muted hover:text-foreground transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-3.5 w-[1px] bg-border" />
            <E310Logo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            <RoleContextBadge
              role={user.role}
              currentPortal="staff"
              canSwitchPortal={isTechUser(user)}
            />
            <div className="h-3.5 w-[1px] bg-border" />
            <NotificationBell />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted hover:bg-surface-subtle hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        <DevicesViewClient initialDevices={initialDevices} />
      </main>
    </div>
  );
}
