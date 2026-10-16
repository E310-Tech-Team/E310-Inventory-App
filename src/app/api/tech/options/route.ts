import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { PortalOption } from "@/types";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const categoryGroup = searchParams.get("categoryGroup") || searchParams.get("group");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("portal_options")
      .select("id, category_group, label, value, is_active, display_order, created_at, updated_at")
      .order("category_group", { ascending: true })
      .order("display_order", { ascending: true })
      .order("label", { ascending: true });

    if (categoryGroup && categoryGroup.trim() !== "all") {
      query = query.eq("category_group", categoryGroup.trim());
    }

    if (activeOnly) {
      query = query.eq("is_active", true);
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error("Failed to query portal options:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const options: PortalOption[] = (rows ?? []).map((row) => ({
      id: row.id,
      categoryGroup: row.category_group,
      label: row.label,
      value: row.value,
      isActive: row.is_active,
      displayOrder: row.display_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    // Group options by categoryGroup for convenient UI consuming
    const grouped: Record<string, PortalOption[]> = {};
    for (const opt of options) {
      if (!grouped[opt.categoryGroup]) {
        grouped[opt.categoryGroup] = [];
      }
      grouped[opt.categoryGroup].push(opt);
    }

    return NextResponse.json({ options, grouped });
  } catch (error) {
    console.error("Portal options GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching portal options" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const { categoryGroup, label, value, displayOrder = 0, isActive = true } = body;

    if (!categoryGroup || typeof categoryGroup !== "string" || categoryGroup.trim().length === 0) {
      return NextResponse.json({ error: "categoryGroup is required" }, { status: 400 });
    }

    if (!label || typeof label !== "string" || label.trim().length === 0) {
      return NextResponse.json({ error: "label is required" }, { status: 400 });
    }

    const cleanGroup = categoryGroup.trim().toLowerCase();
    const cleanLabel = label.trim();
    const cleanValue = (
      typeof value === "string" && value.trim().length > 0
        ? value.trim()
        : cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    );

    const supabase = getSupabaseAdminClient();

    // Check uniqueness within group
    const { data: existing } = await supabase
      .from("portal_options")
      .select("id")
      .eq("category_group", cleanGroup)
      .eq("value", cleanValue)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `An option with value "${cleanValue}" already exists in group "${cleanGroup}".` },
        { status: 409 }
      );
    }

    const { data: newRow, error: insertError } = await supabase
      .from("portal_options")
      .insert({
        category_group: cleanGroup,
        label: cleanLabel,
        value: cleanValue,
        display_order: typeof displayOrder === "number" ? displayOrder : 0,
        is_active: Boolean(isActive),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert portal option:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Audit log
    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: "portal_option_created",
        entity_type: "portal_option",
        entity_id: newRow.id,
        details: {
          categoryGroup: cleanGroup,
          label: cleanLabel,
          value: cleanValue,
        },
      });
    } catch (auditErr) {
      console.warn("Audit log creation failed for portal option:", auditErr);
    }

    const option: PortalOption = {
      id: newRow.id,
      categoryGroup: newRow.category_group,
      label: newRow.label,
      value: newRow.value,
      isActive: newRow.is_active,
      displayOrder: newRow.display_order,
      createdAt: newRow.created_at,
      updatedAt: newRow.updated_at,
    };

    return NextResponse.json({ success: true, option }, { status: 201 });
  } catch (error) {
    console.error("Portal options POST error:", error);
    return NextResponse.json(
      { error: "Internal server error creating portal option" },
      { status: 500 }
    );
  }
}
