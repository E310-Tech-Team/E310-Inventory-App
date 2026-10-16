import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

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

    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Ticket ID is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    // Query ticket by ID, strictly enforcing user ownership (user can only view their own tickets)
    const { data: complaint, error } = await supabase
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
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error retrieving ticket details:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!complaint) {
      return NextResponse.json(
        { error: "Ticket not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error("Staff complaint detail error:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving ticket" },
      { status: 500 }
    );
  }
}
