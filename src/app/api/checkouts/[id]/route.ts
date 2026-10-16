import { NextRequest, NextResponse } from "next/server";
import { dataStore } from "@/lib/data";
import { requireActiveUser } from "@/lib/auth/permissions";
import { cleanOptionalString } from "@/lib/validation";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireActiveUser();
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const checkout = await dataStore.getCheckout(id);
  if (!checkout) {
    return NextResponse.json({ error: "Checkout not found" }, { status: 404 });
  }

  const updatePayload: Record<string, any> = {};

  if (body.dueDate !== undefined) {
    updatePayload.dueDate = body.dueDate ? String(body.dueDate).trim() : null;
  }

  if (body.collectionNotes !== undefined) {
    updatePayload.collectionNotes = cleanOptionalString(body.collectionNotes);
  }

  const updatedCheckout = await dataStore.updateCheckout(id, updatePayload);

  // Log in audit_logs
  if (hasSupabaseConfig() && body.dueDate !== undefined) {
    try {
      const supabase = getSupabaseAdminClient();
      await supabase.from("audit_logs").insert({
        actor_id: auth.user.id,
        actor_name: auth.user.name,
        action_type: "checkout_due_date_extended",
        entity_type: "checkout",
        entity_id: id,
        details: {
          previousDueDate: checkout.dueDate,
          newDueDate: updatePayload.dueDate,
          extendedBy: auth.user.name,
          assignedTo: checkout.assignedToName,
        },
      });
    } catch (auditErr) {
      console.warn("Failed to log due date extension in audit_logs:", auditErr);
    }
  }

  return NextResponse.json(updatedCheckout);
}
