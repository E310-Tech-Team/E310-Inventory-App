import { NextRequest, NextResponse } from "next/server";
import { requireActiveUser } from "@/lib/auth/permissions";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireActiveUser();
    if ("response" in auth) return auth.response;
    const { user } = auth;

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database service is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Device ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Accept either itemId or checkoutId so callers remain resilient
    let targetItemId = id;
    let { data: item } = await supabase
      .from("items")
      .select("id, name, serial_number, registered_by_staff, approval_status, created_by")
      .eq("id", targetItemId)
      .maybeSingle();

    if (!item) {
      const { data: checkoutById } = await supabase
        .from("checkouts")
        .select("item_id")
        .eq("id", id)
        .maybeSingle();

      if (checkoutById?.item_id) {
        targetItemId = checkoutById.item_id;
        const { data: itemFromCheckout } = await supabase
          .from("items")
          .select("id, name, serial_number, registered_by_staff, approval_status, created_by")
          .eq("id", targetItemId)
          .maybeSingle();
        item = itemFromCheckout;
      }
    }

    if (!item) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (!item.registered_by_staff) {
      return NextResponse.json(
        {
          error:
            "Only self-registered devices can be deleted here. Contact IT support to return company-issued hardware.",
        },
        { status: 403 }
      );
    }

    // Verify ownership: user has custody checkout for this item, created it, or is super-admin
    const { data: userCheckout } = await supabase
      .from("checkouts")
      .select("id")
      .eq("item_id", item.id)
      .ilike("assigned_to_email", user.email)
      .limit(1)
      .maybeSingle();

    const isCreator =
      typeof item.created_by === "string" &&
      item.created_by.trim().toLowerCase() === user.name.trim().toLowerCase();

    if (!userCheckout && !isCreator && user.role !== "super-admin") {
      return NextResponse.json(
        { error: "You can only delete devices you registered." },
        { status: 403 }
      );
    }

    // Deleting the item cascades to public.checkouts and detaches device_complaints.item_id (set null)
    const { error: deleteError } = await supabase.from("items").delete().eq("id", item.id);
    if (deleteError) {
      console.error("Failed to delete self-registered device:", deleteError);
      return NextResponse.json(
        { error: deleteError.message || "Failed to delete device" },
        { status: 500 }
      );
    }

    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: "device_self_registration_deleted",
        entity_type: "item",
        entity_id: item.id,
        details: {
          itemName: item.name,
          serialNumber: item.serial_number,
          approvalStatus: item.approval_status,
          deletedByEmail: user.email,
        },
      });
    } catch (auditErr) {
      console.warn("Failed to create audit log for device deletion:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Device "${item.name}" has been removed.`,
      deletedItemId: item.id,
    });
  } catch (error) {
    console.error("Staff device deletion error:", error);
    return NextResponse.json(
      { error: "Internal server error deleting device" },
      { status: 500 }
    );
  }
}

