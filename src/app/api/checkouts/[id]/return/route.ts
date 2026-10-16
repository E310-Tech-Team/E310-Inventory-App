import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";
import { cleanOptionalString, isItemCondition } from "@/lib/validation";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;
  const returnNotes = cleanOptionalString(body.returnNotes);
  const createRepairTicket = body.createRepairTicket === true;

  if (!isItemCondition(body.conditionOnReturn)) {
    return NextResponse.json({ error: "Condition is required" }, { status: 400 });
  }

  const checkout = await dataStore.getCheckout(id);
  if (!checkout) {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }
  if (checkout.status === "returned") {
    return NextResponse.json({ error: "Already returned" }, { status: 409 });
  }

  const updatedCheckout = await dataStore.updateCheckout(id, {
    dateReturned: new Date().toISOString(),
    conditionOnReturn: body.conditionOnReturn,
    returnNotes,
    status: "returned",
  });

  const item = await dataStore.getItem(checkout.itemId);
  if (item) {
    if (item.quantity !== null && checkout.quantity !== null) {
      const category = await dataStore.getCategory(item.categoryId);
      const restored = item.quantity + checkout.quantity;
      const nextStatus =
        category?.lowStockThreshold !== null &&
        category?.lowStockThreshold !== undefined &&
        restored <= category.lowStockThreshold
          ? "low-stock"
          : "available";
      await dataStore.updateItem(item.id, { quantity: restored, status: nextStatus });
    } else {
      await dataStore.updateItem(item.id, {
        status: "available",
        condition: body.conditionOnReturn,
      });
    }
  }

  let repairTicket = null;

  // If item is returned damaged, create an immediate repair ticket in device_complaints
  if ((body.conditionOnReturn === "damaged" || createRepairTicket) && item && hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseAdminClient();
      const currentYear = new Date().getFullYear();

      // Sequence nextval or fallback
      let sequenceNumber = 1001;
      const { data: seqData, error: seqErr } = await supabase.rpc("nextval", {
        seq_name: "complaint_ticket_seq",
      });

      if (!seqErr && typeof seqData === "number") {
        sequenceNumber = seqData;
      } else {
        const { count } = await supabase
          .from("device_complaints")
          .select("id", { count: "exact", head: true });
        sequenceNumber = (count || 0) + 1001;
      }

      const ticketNumber = `TKT-${currentYear}-${String(sequenceNumber).padStart(4, "0")}`;

      // Resolve staff user ID from assigned_to_email
      let staffUserId = auth.user.id;
      if (checkout.assignedToEmail) {
        const { data: staffMember } = await supabase
          .from("department_users")
          .select("id")
          .eq("email", checkout.assignedToEmail.toLowerCase())
          .maybeSingle();

        if (staffMember) {
          staffUserId = staffMember.id;
        }
      }

      const issueDescription = `Returned in damaged condition from custody of ${checkout.assignedToName}. Return notes: ${returnNotes || "Hardware damage reported upon return."}`;

      const { data: ticket, error: ticketErr } = await supabase
        .from("device_complaints")
        .insert({
          ticket_number: ticketNumber,
          user_id: staffUserId,
          item_id: item.id,
          device_name: item.name,
          serial_number: item.serialNumber || item.identifierValue || "N/A",
          category: "Hardware Failure",
          issue_description: issueDescription,
          priority: "high",
          status: "open",
        })
        .select()
        .single();

      if (!ticketErr && ticket) {
        repairTicket = ticket;

        // Log audit log
        try {
          await supabase.from("audit_logs").insert({
            actor_id: auth.user.id,
            actor_name: auth.user.name,
            action_type: "repair_ticket_auto_created",
            entity_type: "complaint",
            entity_id: ticket.id,
            details: {
              ticketNumber: ticket.ticket_number,
              itemId: item.id,
              itemName: item.name,
              checkoutId: checkout.id,
              returnedBy: checkout.assignedToName,
            },
          });
        } catch (auditErr) {
          console.warn("Failed to create audit log for damaged return:", auditErr);
        }

        // Send notification
        try {
          await supabase.from("notifications").insert({
            recipient_id: staffUserId,
            title: "Repair Ticket Generated",
            message: `A high-priority repair ticket (${ticketNumber}) was automatically created for ${item.name} upon return.`,
            notification_type: "complaint_logged",
            link_url: "/staff",
            is_read: false,
            email_sent: false,
          });
        } catch (notifErr) {
          console.warn("Failed to notify staff member of repair ticket:", notifErr);
        }
      }
    } catch (ticketCreationErr) {
      console.warn("Failed to automatically generate repair ticket:", ticketCreationErr);
    }
  }

  return NextResponse.json({
    ...updatedCheckout,
    repairTicket,
  });
}
