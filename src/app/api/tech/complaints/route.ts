import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority") || searchParams.get("severity");
    const assignedTechId = searchParams.get("assigned_tech_id");
    const search = searchParams.get("search");

    const supabase = getSupabaseAdminClient();

    let query = supabase
      .from("device_complaints")
      .select(`
        id,
        ticket_number,
        user_id,
        user_name,
        user_email,
        user_department,
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
          id,
          name,
          serial_number,
          identifier_type,
          identifier_value
        ),
        assigned_tech:department_users!assigned_tech_id (
          id,
          name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    // Apply status filter
    if (status && status.trim() !== "all") {
      const statusList = status.split(",").map((s) => s.trim());
      if (statusList.length === 1) {
        query = query.eq("status", statusList[0]);
      } else {
        query = query.in("status", statusList);
      }
    }

    // Apply priority / severity filter
    if (priority && priority.trim() !== "all") {
      query = query.eq("priority", priority.trim());
    }

    // Apply assigned tech filter
    if (assignedTechId) {
      if (assignedTechId === "unassigned") {
        query = query.is("assigned_tech_id", null);
      } else {
        query = query.eq("assigned_tech_id", assignedTechId.trim());
      }
    }

    // Apply text search across ticket number, title, and submitter name/email
    if (search && search.trim().length > 0) {
      const q = search.trim();
      query = query.or(
        `ticket_number.ilike.%${q}%,title.ilike.%${q}%,user_name.ilike.%${q}%,user_email.ilike.%${q}%,description.ilike.%${q}%`
      );
    }

    const { data: complaints, error } = await query;

    if (error) {
      console.error("Error querying tech complaints:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ complaints: complaints ?? [] });
  } catch (error) {
    console.error("Tech complaints GET error:", error);
    return NextResponse.json(
      { error: "Internal server error querying complaints" },
      { status: 500 }
    );
  }
}
