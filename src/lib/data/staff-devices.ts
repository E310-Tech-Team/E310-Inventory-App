import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { CheckoutStatus, ItemCondition, ItemIdentifierType, StaffDevice } from "@/types";

interface JoinedItemCategory {
  id: string;
  name: string;
  tracking_type?: string;
  return_type?: string;
}

interface JoinedItem {
  id: string;
  name: string;
  serial_number: string | null;
  identifier_type: ItemIdentifierType | null;
  identifier_value: string | null;
  condition: ItemCondition;
  registered_by_staff: boolean | null;
  approval_status: "pending" | "approved" | "rejected" | null;
  category: JoinedItemCategory | null;
}

interface RawCheckoutRow {
  id: string;
  item_id: string;
  date_collected: string;
  due_date: string | null;
  status: CheckoutStatus;
  item: JoinedItem | null;
}

interface ActiveComplaintSummary {
  id: string;
  ticketNumber: string;
  title: string;
  status: string;
  priority: string;
}

/**
 * Load active and overdue equipment currently assigned to a staff member,
 * optionally enriched with active repair tickets.
 */
export async function getStaffDevices(
  user: { id: string; email: string },
  options: { includeComplaints?: boolean } = {}
): Promise<StaffDevice[]> {
  if (!hasSupabaseConfig()) return [];

  const supabase = getSupabaseAdminClient();
  const { data: checkoutRows, error: checkoutError } = await supabase
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
        registered_by_staff,
        approval_status,
        category:categories (
          id,
          name,
          tracking_type,
          return_type
        )
      )
    `)
    .ilike("assigned_to_email", user.email)
    .in("status", ["active", "overdue"])
    .order("date_collected", { ascending: false });

  if (checkoutError) {
    throw checkoutError;
  }

  const complaintMap = new Map<string, ActiveComplaintSummary>();

  if (options.includeComplaints) {
    const { data: complaints, error: complaintError } = await supabase
      .from("device_complaints")
      .select("id, ticket_number, item_id, title, status, severity")
      .eq("user_id", user.id)
      .not("status", "in", '("resolved","closed","cancelled")');

    if (complaintError) {
      console.warn("Failed to retrieve linked complaints for staff devices:", complaintError);
    } else if (complaints) {
      for (const comp of complaints) {
        if (comp.item_id && !complaintMap.has(comp.item_id)) {
          complaintMap.set(comp.item_id, {
            id: comp.id,
            ticketNumber: comp.ticket_number,
            title: comp.title,
            status: comp.status,
            priority: comp.severity ?? "medium",
          });
        }
      }
    }
  }

  const rows = (checkoutRows ?? []) as unknown as RawCheckoutRow[];
  return rows
    .filter((row): row is RawCheckoutRow & { item: JoinedItem } => Boolean(row.item))
    .map((row) => {
      const item = row.item;
      return {
        checkoutId: row.id,
        itemId: item.id,
        name: item.name ?? "Hardware Device",
        categoryName: item.category?.name ?? "General Hardware",
        serialNumber: item.serial_number,
        identifierType: item.identifier_type,
        identifierValue: item.identifier_value,
        condition: item.condition ?? "good",
        dateCollected: row.date_collected,
        dueDate: row.due_date,
        status: row.status,
        registeredByStaff: Boolean(item.registered_by_staff),
        approvalStatus: item.approval_status ?? "approved",
        activeComplaint: complaintMap.get(item.id) ?? null,
      };
    });
}

