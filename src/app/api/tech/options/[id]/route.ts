import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { PortalOption } from "@/types";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const supabase = getSupabaseAdminClient();

    const { data: row, error } = await supabase
      .from("portal_options")
      .select("id, category_group, label, value, is_active, display_order, created_at, updated_at")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!row) {
      return NextResponse.json({ error: "Option not found" }, { status: 404 });
    }

    const option: PortalOption = {
      id: row.id,
      categoryGroup: row.category_group,
      label: row.label,
      value: row.value,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };

    return NextResponse.json({ option });
  } catch (error) {
    console.error("Option GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching option" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTechUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to Tech Team administrators" },
        { status: 403 }
      );
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database service is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { label, isActive, displayOrder } = body;
    const updateData: Record<string, unknown> = {};

    if (label !== undefined && typeof label === "string" && label.trim().length > 0) {
      updateData.label = label.trim();
    }

    if (isActive !== undefined) {
      updateData.is_active = Boolean(isActive);
    }

    if (displayOrder !== undefined && typeof displayOrder === "number") {
      updateData.display_order = displayOrder;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields provided to update" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: updatedRow, error: updateError } = await supabase
      .from("portal_options")
      .update(updateData)
      .eq("id", id)
      .select("id, category_group, label, value, is_active, display_order, created_at, updated_at")
      .single();

    if (updateError) {
      console.error("Failed to update portal option:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Audit log
    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: "portal_option_updated",
        entity_type: "portal_option",
        entity_id: id,
        details: {
          categoryGroup: updatedRow.category_group,
          updatedFields: Object.keys(updateData),
        },
      });
    } catch (auditErr) {
      console.warn("Audit logging failed for option update:", auditErr);
    }

    const option: PortalOption = {
      id: updatedRow.id,
      categoryGroup: updatedRow.category_group,
      label: updatedRow.label,
      value: updatedRow.value,
      isActive: updatedRow.is_active,
      displayOrder: updatedRow.display_order,
      createdAt: updatedRow.created_at,
      updatedAt: updatedRow.updated_at,
    };

    return NextResponse.json({ success: true, option });
  } catch (error) {
    console.error("Option PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error updating option" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isTechUser(user)) {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to Tech Team administrators" },
        { status: 403 }
      );
    }

    if (!hasSupabaseConfig()) {
      return NextResponse.json(
        { error: "Database service is not configured" },
        { status: 500 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get("hard") === "true";

    const supabase = getSupabaseAdminClient();

    if (hardDelete) {
      const { error } = await supabase.from("portal_options").delete().eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    } else {
      // Soft disable by default to preserve historical integrity
      const { error } = await supabase
        .from("portal_options")
        .update({ is_active: false })
        .eq("id", id);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: hardDelete ? "portal_option_deleted" : "portal_option_disabled",
        entity_type: "portal_option",
        entity_id: id,
        details: { hardDelete },
      });
    } catch (auditErr) {
      console.warn("Audit logging failed for option deletion:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: hardDelete ? "Option deleted permanently." : "Option deactivated successfully.",
    });
  } catch (error) {
    console.error("Option DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error deleting option" },
      { status: 500 }
    );
  }
}
