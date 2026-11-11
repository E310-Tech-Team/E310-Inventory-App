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
        item_id,
        device_summary,
        title,
        description,
        issue_type,
        severity,
        status,
        attachment_urls,
        assigned_tech_id,
        resolution_notes,
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
        submitter:user_id (
          id,
          name,
          email,
          department
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
      query = query.eq("severity", priority.trim());
    }

    // Apply assigned tech filter
    if (assignedTechId) {
      if (assignedTechId === "unassigned") {
        query = query.is("assigned_tech_id", null);
      } else {
        query = query.eq("assigned_tech_id", assignedTechId.trim());
      }
    }

    // Apply text search across ticket number, title, and description
    if (search && search.trim().length > 0) {
      const q = search.trim();
      query = query.or(
        `ticket_number.ilike.%${q}%,title.ilike.%${q}%,description.ilike.%${q}%`
      );
    }

    const { data: rawComplaints, error } = await query;

    if (error) {
      console.error("Error querying tech complaints:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const complaints = (rawComplaints ?? []).map((c: any) => ({
      id: c.id,
      ticket_number: c.ticket_number,
      ticketNumber: c.ticket_number,
      user_id: c.user_id,
      userId: c.user_id,
      user_name: c.submitter?.name ?? "Staff Member",
      userName: c.submitter?.name ?? "Staff Member",
      user_email: c.submitter?.email ?? "",
      userEmail: c.submitter?.email ?? "",
      user_department: c.submitter?.department ?? null,
      userDepartment: c.submitter?.department ?? null,
      item_id: c.item_id,
      itemId: c.item_id,
      device_summary: c.device_summary,
      deviceSummary: c.device_summary,
      title: c.title,
      description: c.description,
      issue_type: c.issue_type,
      issueType: c.issue_type,
      priority: c.severity,
      severity: c.severity,
      status: c.status,
      attachment_urls: c.attachment_urls ?? [],
      attachmentUrls: c.attachment_urls ?? [],
      assigned_tech_id: c.assigned_tech_id,
      assignedTechId: c.assigned_tech_id,
      assigned_tech: c.assigned_tech,
      assignedTech: c.assigned_tech,
      assignedTechName: c.assigned_tech?.name ?? null,
      tech_notes: c.resolution_notes,
      techNotes: c.resolution_notes,
      resolution_summary: c.resolution_notes,
      resolutionSummary: c.resolution_notes,
      resolved_at: c.resolved_at,
      resolvedAt: c.resolved_at,
      created_at: c.created_at,
      createdAt: c.created_at,
      updated_at: c.updated_at,
      updatedAt: c.updated_at,
      item: c.item,
      itemName: c.item?.name ?? null,
      itemSerial: c.item?.serial_number ?? null,
    }));

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error("Tech complaints GET error:", error);
    return NextResponse.json(
      { error: "Internal server error querying complaints" },
      { status: 500 }
    );
  }
}
