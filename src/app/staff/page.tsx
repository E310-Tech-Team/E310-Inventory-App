import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { StaffDevice, DeviceComplaint } from "@/types";
import { E310Logo } from "@/components/common/E310Logo";
import { RoleContextBadge } from "@/components/common/RoleContextBadge";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { StaffDashboard } from "@/components/staff/StaffDashboard";
import { AlertCircle, LogOut, ShieldCheck } from "lucide-react";

export default async function StaffPortalPage({
  searchParams,
}: {
  searchParams?: Promise<{ forbidden?: string }>;
}) {
  const params = await searchParams;
  const isForbidden = params?.forbidden === "true";
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  let initialDevices: StaffDevice[] = [];
  let initialComplaints: DeviceComplaint[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdminClient();

      // Fetch active devices in custody
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

      // Fetch staff complaints
      const { data: complaintRows } = await supabase
        .from("device_complaints")
        .select(`
          id,
          ticket_number,
          user_id,
          user_name,
          user_email,
          item_id,
          title,
          description,
          issue_type,
          priority,
          status,
          created_at,
          updated_at
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (complaintRows) {
        initialComplaints = complaintRows.map((c: any) => ({
          id: c.id,
          ticketNumber: c.ticket_number,
          userId: c.user_id,
          userName: c.user_name,
          userEmail: c.user_email,
          itemId: c.item_id,
          title: c.title,
          description: c.description,
          issueType: c.issue_type,
          priority: c.priority,
          status: c.status,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }
    } catch (err) {
      console.warn("Could not load initial staff data during SSR:", err);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 403 Forbidden Access Restricted Banner */}
      {isForbidden && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-2 text-center text-xs text-amber-500 dark:text-amber-300">
          <AlertCircle className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5 text-amber-500 dark:text-amber-400" />
          Access Restricted: The Tech Command Center is reserved for IT specialists.
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="border-b border-border bg-surface/80 backdrop-blur-md px-6 py-3 sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/staff" className="flex items-center">
              <E310Logo size="sm" />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/staff"
                className="px-2.5 py-1 rounded-md text-xs font-semibold text-brand-navy bg-brand-yellow"
              >
                Dashboard
              </Link>
              <Link
                href="/staff/devices"
                className="px-2.5 py-1 rounded-md text-xs font-medium text-muted hover:text-foreground transition-colors"
              >
                My Devices
              </Link>

            </nav>
          </div>

          <div className="flex items-center gap-3">
            <RoleContextBadge
              role={user.role}
              currentPortal="staff"
              canSwitchPortal={isTechUser(user)}
            />

            <div className="h-3.5 w-[1px] bg-border" />

            <NotificationBell />
            <ThemeToggle compact />

            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-foreground">{user.name}</p>
              <p className="text-[11px] text-muted">{user.email}</p>
            </div>

            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
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
        <StaffDashboard
          user={user}
          initialDevices={initialDevices}
          initialComplaints={initialComplaints}
        />
      </main>
    </div>
  );
}
