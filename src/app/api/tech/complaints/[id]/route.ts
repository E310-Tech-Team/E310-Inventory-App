import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { dispatchAsyncEmail, sendTicketResolvedEmail } from "@/lib/email/service";

export async function GET(
  _request: NextRequest,
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
    const supabase = getSupabaseAdminClient();

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
      .maybeSingle();

    if (error) {
      console.error("Error retrieving tech complaint:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!complaint) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ complaint });
  } catch (error) {
    console.error("Tech complaint GET error:", error);
    return NextResponse.json(
      { error: "Internal server error retrieving ticket" },
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

    const {
      status,
      techNotes,
      resolutionSummary,
      priority,
      assignedTechId,
    } = body;

    const validStatuses = [
      "pending",
      "assigned",
      "in-progress",
      "waiting-parts",
      "resolved",
      "closed",
    ];

    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    if (priority !== undefined && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Fetch current complaint to detect changes
    const { data: currentComplaint, error: fetchError } = await supabase
      .from("device_complaints")
      .select("id, ticket_number, user_id, status, assigned_tech_id, title")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !currentComplaint) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 2. Prepare update payload
    const updateData: Record<string, unknown> = {};

    if (status !== undefined) {
      updateData.status = status;
      if (status === "resolved" || status === "closed") {
        updateData.resolved_at = new Date().toISOString();
      } else if (currentComplaint.status === "resolved" || currentComplaint.status === "closed") {
        updateData.resolved_at = null;
      }
    }

    if (techNotes !== undefined) {
      updateData.tech_notes = typeof techNotes === "string" ? techNotes.trim() : null;
    }

    if (resolutionSummary !== undefined) {
      updateData.resolution_summary =
        typeof resolutionSummary === "string" ? resolutionSummary.trim() : null;
    }

    if (priority !== undefined) {
      updateData.priority = priority;
    }

    if (assignedTechId !== undefined) {
      updateData.assigned_tech_id = assignedTechId || null;
      if (assignedTechId && currentComplaint.status === "pending") {
        updateData.status = "assigned";
      }
    }

    // 3. Execute update
    const { data: updatedComplaint, error: updateError } = await supabase
      .from("device_complaints")
      .update(updateData)
      .eq("id", id)
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
      .single();

    if (updateError) {
      console.error("Error updating complaint ticket:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 4. Audit logging
    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: "complaint_updated",
        entity_type: "device_complaint",
        entity_id: id,
        details: {
          ticketNumber: currentComplaint.ticket_number,
          oldStatus: currentComplaint.status,
          newStatus: updatedComplaint.status,
          updatedFields: Object.keys(updateData),
        },
      });
    } catch (auditErr) {
      console.warn("Audit logging failed for complaint update:", auditErr);
    }

    // 5. Trigger notification back to reporting staff member on status change
    if (status !== undefined && status !== currentComplaint.status) {
      try {
        const statusLabel = status.replace("-", " ").toUpperCase();
        const notificationMsg =
          resolutionSummary ||
          techNotes ||
          `Your hardware complaint status has been updated to "${statusLabel}".`;

        await supabase.from("notifications").insert({
          recipient_id: currentComplaint.user_id,
          title: `Ticket ${currentComplaint.ticket_number} Updated (${statusLabel})`,
          message: notificationMsg,
          notification_type: "complaint_status_changed",
          link_url: `/staff`,
          is_read: false,
          email_sent: status === "resolved" || status === "closed",
        });

        // If ticket was resolved or closed, dispatch resolution email to staff
        if (status === "resolved" || status === "closed") {
          const resolvedItem = Array.isArray(updatedComplaint.item)
            ? updatedComplaint.item[0]
            : updatedComplaint.item;

          dispatchAsyncEmail(
            sendTicketResolvedEmail({
              ticketNumber: updatedComplaint.ticket_number,
              staffName: updatedComplaint.user_name || "Staff Member",
              staffEmail: updatedComplaint.user_email || "",
              title: updatedComplaint.title,
              issueType: updatedComplaint.issue_type,
              resolutionSummary,
              techNotes,
              resolvedAt: updatedComplaint.resolved_at || new Date().toISOString(),
              resolverName: user.name,
              deviceName: resolvedItem?.name,
            }),
            `Ticket resolution email [${updatedComplaint.ticket_number}]`
          );
        }
      } catch (notifErr) {
        console.warn("Notification dispatch to staff failed:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Ticket ${currentComplaint.ticket_number} updated successfully.`,
      complaint: updatedComplaint,
    });
  } catch (error) {
    console.error("Tech complaint PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error updating complaint" },
      { status: 500 }
    );
  }
}
