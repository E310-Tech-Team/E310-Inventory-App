import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import {
  DeviceComplaint,
  StaffDevice,
  ComplaintStatus,
  ItemIdentifierType,
  ItemCondition,
} from "@/types";
import { StaffHeader } from "@/components/staff/StaffHeader";
import { TicketStatusTracker } from "@/components/staff/TicketStatusTracker";

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
          item_id,
          device_summary,
          title,
          description,
          issue_type,
          severity,
          status,
          attachment_urls,
          assigned_tech_id,
          resolution_notes,
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
        complaints = (rawComplaintRows as any[]).map((c) => ({
          id: c.id,
          ticketNumber: c.ticket_number,
          userId: c.user_id,
          userName: user.name,
          userEmail: user.email,
          userDepartment: user.department ?? null,
          itemId: c.item_id,
          itemName: c.item?.name ?? null,
          itemSerial: c.item?.serial_number ?? null,
          deviceSummary: c.device_summary ?? null,
          title: c.title,
          description: c.description,
          issueType: c.issue_type,
          priority: c.severity || "medium",
          severity: c.severity || "medium",
          status: c.status,
          attachmentUrls: c.attachment_urls ?? [],
          assignedTechId: c.assigned_tech_id ?? null,
          assignedTechName: c.assigned_tech?.name ?? null,
          techNotes: c.resolution_notes ?? null,
          resolutionSummary: c.resolution_notes ?? null,
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
    <div className="min-h-screen bg-background text-foreground">
      <StaffHeader user={user} activePath="/staff/tickets" />

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 sm:px-6 py-4 sm:py-7 pb-8">
        <TicketStatusTracker initialComplaints={complaints} devices={devices} />
      </main>
    </div>
  );
}
