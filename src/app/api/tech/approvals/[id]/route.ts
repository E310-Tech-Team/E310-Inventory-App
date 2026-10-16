import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTechUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Only Tech Team members can approve or reject devices" },
        { status: 403 }
      );
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database service is not configured" },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { action, assetTag, condition, notes, rejectionReason } = body;

    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'approve' or 'reject'" },
        { status: 400 }
      );
    }

    if (action === "reject" && (!rejectionReason || typeof rejectionReason !== "string" || rejectionReason.trim().length === 0)) {
      return NextResponse.json(
        { error: "A rejection reason is required to notify the staff member" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Fetch the target item
    const { data: item, error: itemFetchError } = await supabase
      .from("items")
      .select("*, category:categories(name)")
      .eq("id", id)
      .eq("registered_by_staff", true)
      .single();

    if (itemFetchError || !item) {
      return NextResponse.json(
        { error: "Device registration record not found" },
        { status: 404 }
      );
    }

    // 2. Locate the staff member who registered it via checkouts or user table
    const { data: checkout } = await supabase
      .from("checkouts")
      .select("assigned_to_email, assigned_to_name")
      .eq("item_id", id)
      .order("date_collected", { ascending: false })
      .limit(1)
      .maybeSingle();

    let staffRecipientId: string | null = null;
    const staffEmail = checkout?.assigned_to_email || null;

    if (staffEmail) {
      const { data: staffUser } = await supabase
        .from("department_users")
        .select("id")
        .eq("email", staffEmail.toLowerCase())
        .maybeSingle();

      if (staffUser) {
        staffRecipientId = staffUser.id;
      }
    }

    // 3. Process action
    if (action === "approve") {
      const trimmedAssetTag = assetTag ? String(assetTag).trim() : null;
      const updatedNotes = notes ? String(notes).trim() : item.notes;

      const updatePayload: Record<string, any> = {
        approval_status: "approved",
        notes: updatedNotes,
      };

      if (trimmedAssetTag) {
        updatePayload.identifier_type = "asset-tag";
        updatePayload.identifier_value = trimmedAssetTag;
      }

      if (condition && ["new", "good", "fair", "damaged"].includes(condition)) {
        updatePayload.condition = condition;
      }

      const { data: updatedItem, error: updateError } = await supabase
        .from("items")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to approve device registration:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Log in audit_logs
      try {
        await supabase.from("audit_logs").insert({
          actor_id: user.id,
          actor_name: user.name,
          action_type: "device_registration_approved",
          entity_type: "item",
          entity_id: id,
          details: {
            itemName: item.name,
            serialNumber: item.serial_number,
            assetTag: trimmedAssetTag,
            approvedBy: user.name,
          },
        });
      } catch (auditErr) {
        console.warn("Failed to create audit log for approval:", auditErr);
      }

      // Dispatch notification to staff member
      if (staffRecipientId) {
        try {
          const tagInfo = trimmedAssetTag ? ` (Asset Tag: ${trimmedAssetTag})` : "";
          await supabase.from("notifications").insert({
            recipient_id: staffRecipientId,
            title: "Device Registration Approved",
            message: `Your device "${item.name}" (SN: ${item.serial_number})${tagInfo} has been verified and registered into official inventory.`,
            notification_type: "device_approved",
            link_url: "/staff",
            is_read: false,
            email_sent: false,
          });
        } catch (notifErr) {
          console.warn("Failed to dispatch device approved notification:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Device "${item.name}" successfully approved and tagged.`,
        item: updatedItem,
      });
    } else {
      // Reject action
      const trimmedReason = String(rejectionReason).trim();
      const rejectionNote = `[Registration Rejected by ${user.name}: ${trimmedReason}]`;
      const combinedNotes = item.notes ? `${item.notes}\n${rejectionNote}` : rejectionNote;

      const { data: updatedItem, error: updateError } = await supabase
        .from("items")
        .update({
          approval_status: "rejected",
          notes: combinedNotes,
        })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to reject device registration:", updateError);
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      // Log in audit_logs
      try {
        await supabase.from("audit_logs").insert({
          actor_id: user.id,
          actor_name: user.name,
          action_type: "device_registration_rejected",
          entity_type: "item",
          entity_id: id,
          details: {
            itemName: item.name,
            serialNumber: item.serial_number,
            rejectedBy: user.name,
            reason: trimmedReason,
          },
        });
      } catch (auditErr) {
        console.warn("Failed to create audit log for rejection:", auditErr);
      }

      // Dispatch notification to staff member
      if (staffRecipientId) {
        try {
          await supabase.from("notifications").insert({
            recipient_id: staffRecipientId,
            title: "Device Registration Rejected",
            message: `Your registration for "${item.name}" (SN: ${item.serial_number}) was not approved. Reason: ${trimmedReason}`,
            notification_type: "system_alert",
            link_url: "/staff",
            is_read: false,
            email_sent: false,
          });
        } catch (notifErr) {
          console.warn("Failed to dispatch device rejected notification:", notifErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: `Device registration for "${item.name}" has been rejected.`,
        item: updatedItem,
      });
    }
  } catch (error) {
    console.error("PATCH /api/tech/approvals/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error processing device approval" },
      { status: 500 }
    );
  }
}
