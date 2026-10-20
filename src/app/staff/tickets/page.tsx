import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  DeviceComplaint,
  StaffDevice,
  ComplaintStatus,
  ItemIdentifierType,
  ItemCondition,
} from "@/types";
import { E310Logo } from "@/components/common/E310Logo";
import { RoleContextBadge } from "@/components/common/RoleContextBadge";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { TicketStatusTracker } from "@/components/staff/TicketStatusTracker";
import { ArrowLeft, LogOut } from "lucide-react";

interface SupabaseComplaintRow {
  id: string;
  ticket_number: string;
  user_id: string;
  user_name: string;
  user_email: string;
  item_id: string | null;
  title: string;
  description: string;
  issue_type: string;
  priority: "low" | "medium" | "high" | "critical";
  status: ComplaintStatus;
  attachment_urls: string[] | null;
  assigned_tech_id: string | null;
  tech_notes: string | null;
  resolution_summary: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  item?: {
    name?: string;
    serial_number?: string | null;
  } | null;
  assigned_tech?: {
    name?: string;
  } | null;
}

interface SupabaseCheckoutRow {
  id: string;
  item_id: string;
  date_collected: string;
  due_date: string;
  status: "active" | "overdue";
  item?: {
    id: string;
    name: string;
    serial_number: string | null;
    identifier_type: ItemIdentifierType | null;
    identifier_value: string | null;
    condition: ItemCondition;
    category?: {
      name: string;
    } | null;
  } | null;
}

export default async function StaffTicketsPage() {
  const user = await getSession();

  if (!user) {
    redirect("/login");
  }

  if (user.status === "pending") {
    redirect("/change-password");
  }

  let complaints: DeviceComplaint[] = [];
  let devices: StaffDevice[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdminClient();

      // Fetch complaints for current user
      const { data: rawComplaintRows } = await supabase
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
          attachment_urls,
          assigned_tech_id,
          tech_notes,
          resolution_summary,
          resolved_at,
          created_at,
          updated_at,
          item:items (
            name,
            serial_number
          ),
          assigned_tech:department_users!assigned_tech_id (
            name
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (rawComplaintRows) {
        const complaintRows = rawComplaintRows as unknown as SupabaseComplaintRow[];
        complaints = complaintRows.map((c) => ({
          id: c.id,
          ticketNumber: c.ticket_number,
          userId: c.user_id,
          userName: c.user_name,
          userEmail: c.user_email,
          itemId: c.item_id,
          itemName: c.item?.name ?? null,
          itemSerial: c.item?.serial_number ?? null,
          title: c.title,
          description: c.description,
          issueType: c.issue_type,
          priority: c.priority,
          status: c.status,
          attachmentUrls: c.attachment_urls ?? [],
          assignedTechId: c.assigned_tech_id ?? null,
          assignedTechName: c.assigned_tech?.name ?? null,
          techNotes: c.tech_notes ?? null,
          resolutionSummary: c.resolution_summary ?? null,
          resolvedAt: c.resolved_at ?? null,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }));
      }

      // Fetch assigned devices for filing new complaints
      const { data: rawCheckoutRows } = await supabase
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

      if (rawCheckoutRows) {
        const checkoutRows = rawCheckoutRows as unknown as SupabaseCheckoutRow[];
        devices = checkoutRows
          .filter((row) => Boolean(row.item))
          .map((row) => ({
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
      console.warn("Could not load complaints during SSR:", err);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-zinc-800 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-zinc-800/80 bg-zinc-900/50 backdrop-blur-md px-6 py-3 sticky top-0 z-30">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/staff"
              className="flex items-center gap-2 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Dashboard</span>
            </Link>
            <div className="h-3.5 w-[1px] bg-zinc-800" />
            <E310Logo size="sm" />
          </div>

          <div className="flex items-center gap-3">
            <RoleContextBadge
              role={user.role}
              currentPortal="staff"
              canSwitchPortal={isTechUser(user)}
            />
            <div className="h-3.5 w-[1px] bg-zinc-800" />
            <NotificationBell />
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-zinc-200">{user.name}</p>
              <p className="text-[11px] text-zinc-400">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
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
        <TicketStatusTracker initialComplaints={complaints} devices={devices} />
      </main>
    </div>
  );
}
