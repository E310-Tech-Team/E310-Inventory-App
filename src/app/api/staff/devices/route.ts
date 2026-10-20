import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { StaffDevice, ItemIdentifierType, ItemCondition, CheckoutStatus } from "@/types";

interface JoinedItemCategory {
  id: string;
  name: string;
  tracking_type: string;
  return_type: string;
}

interface JoinedItem {
  id: string;
  name: string;
  serial_number: string | null;
  identifier_type: ItemIdentifierType | null;
  identifier_value: string | null;
  condition: ItemCondition;
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

export async function GET() {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database service is not configured" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Fetch active and overdue checkouts assigned to the authenticated user's email
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
      console.error("Failed to query staff devices:", checkoutError);
      return NextResponse.json({ error: checkoutError.message }, { status: 500 });
    }

    // 2. Fetch active complaints for the staff member to attach any live repair/issue tickets
    const { data: complaints, error: complaintError } = await supabase
      .from("device_complaints")
      .select("id, ticket_number, item_id, title, status, priority")
      .eq("user_id", user.id)
      .not("status", "in", '("resolved","closed")');

    if (complaintError) {
      console.warn("Failed to retrieve linked complaints for staff devices:", complaintError);
    }

    const complaintMap = new Map<string, {
      id: string;
      ticketNumber: string;
      title: string;
      status: string;
      priority: string;
    }>();

    if (complaints && complaints.length > 0) {
      for (const comp of complaints) {
        if (comp.item_id && !complaintMap.has(comp.item_id)) {
          complaintMap.set(comp.item_id, {
            id: comp.id,
            ticketNumber: comp.ticket_number,
            title: comp.title,
            status: comp.status,
            priority: comp.priority,
          });
        }
      }
    }

    // 3. Map into strongly typed StaffDevice list
    const rows = (checkoutRows ?? []) as unknown as RawCheckoutRow[];
    const devices: StaffDevice[] = rows
      .filter((row) => Boolean(row.item))
      .map((row) => {
        const item = row.item!;
        const activeComplaint = complaintMap.get(item.id) ?? null;

        return {
          checkoutId: row.id,
          itemId: item.id,
          name: item.name,
          categoryName: item.category?.name ?? "General Hardware",
          serialNumber: item.serial_number,
          identifierType: item.identifier_type,
          identifierValue: item.identifier_value,
          condition: item.condition,
          dateCollected: row.date_collected,
          dueDate: row.due_date,
          status: row.status,
          activeComplaint,
        };
      });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error("Staff devices retrieval error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching staff equipment" },
      { status: 500 }
    );
  }
}
