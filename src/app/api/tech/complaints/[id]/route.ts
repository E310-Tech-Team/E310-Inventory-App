import { NextRequest, NextResponse } from "next/server";
import { getSession, isTechUser } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { dispatchAsyncEmail, sendTicketResolvedEmail } from "@/lib/email/service";

function mapComplaintResponse(c: Record<string, any>) {
  return {
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
    severity: c.severity || "medium",
    priority: c.severity || "medium",
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
    resolution_notes: c.resolution_notes,
    resolutionNotes: c.resolution_notes,
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
  };
}

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
        submitter:department_users!user_id (
          id,
          name,
          email,
          department
        ),
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

    return NextResponse.json({ complaint: mapComplaintResponse(complaint) });
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
      resolutionNotes,
      priority,
      severity,
      assignedTechId,
    } = body;

    const validStatuses = [
      "submitted",
      "under-review",
      "in-repair",
      "resolved",
      "cancelled",
      "pending",
      "assigned",
      "in-progress",
      "waiting-parts",
      "closed",
    ];

    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    const targetPriority = priority || severity;
    if (targetPriority !== undefined && !validPriorities.includes(targetPriority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(", ")}` },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Fetch current complaint to detect changes
    const { data: currentComplaint, error: fetchError } = await supabase
      .from("device_complaints")
      .select("id, ticket_number, user_id, status, assigned_tech_id, title, resolved_at")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !currentComplaint) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // 2. Prepare update payload
    const nowIso = new Date().toISOString();
    const updateData: Record<string, unknown> = {
      updated_at: nowIso,
    };

    if (status !== undefined) {
      updateData.status = status;
      const isClosingStatus = status === "resolved" || status === "closed";
      const wasClosedStatus =
        currentComplaint.status === "resolved" || currentComplaint.status === "closed";

      if (isClosingStatus) {
        if (!wasClosedStatus || !currentComplaint.resolved_at) {
          updateData.resolved_at = nowIso;
        }
      } else if (wasClosedStatus) {
        updateData.resolved_at = null;
      }
    }

    const notesContent = resolutionNotes ?? resolutionSummary ?? techNotes;
    if (notesContent !== undefined) {
      updateData.resolution_notes =
        typeof notesContent === "string" ? notesContent.trim() : null;
    }

    if (targetPriority !== undefined) {
      updateData.severity = targetPriority;
    }

    if (assignedTechId !== undefined) {
      updateData.assigned_tech_id = assignedTechId || null;
      if (assignedTechId && (currentComplaint.status === "submitted" || currentComplaint.status === "pending")) {
        updateData.status = "under-review";
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
        submitter:department_users!user_id (
          id,
          name,
          email,
          department
        ),
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

    if (updateError || !updatedComplaint) {
      console.error("Error updating complaint ticket:", updateError);
      return NextResponse.json(
        { error: updateError?.message || "Failed to update complaint" },
        { status: 500 }
      );
    }

    const mapped = mapComplaintResponse(updatedComplaint);

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
          newStatus: mapped.status,
          updatedFields: Object.keys(updateData),
        },
      });
    } catch (auditErr) {
      console.warn("Audit logging failed for complaint update:", auditErr);
    }

    // 5. Trigger notification back to reporting staff member on status change
    if (status !== undefined && status !== currentComplaint.status) {
      try {
        const stageNames: Record<string, string> = {
          "submitted": "Submitted",
          "pending": "Submitted",
          "under-review": "Triage & Review",
          "assigned": "Triage & Review",
          "in-repair": "In Diagnostic / Repair",
          "in-progress": "In Diagnostic / Repair",
          "waiting-parts": "In Diagnostic / Repair",
          "resolved": "Resolved",
          "closed": "Resolved",
        };
        const statusLabel = stageNames[status] || status.replace("-", " ").toUpperCase();
        const notificationMsg =
          updateData.resolution_notes ||
          `Your hardware complaint has moved to "${statusLabel}".`;

        await supabase.from("notifications").insert({
          recipient_id: currentComplaint.user_id,
          title: `Ticket ${currentComplaint.ticket_number} — ${statusLabel}`,
          message: notificationMsg as string,
          notification_type: "complaint_status_changed",
          link_url: `/staff/tickets`,
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
              ticketNumber: mapped.ticketNumber,
              staffName: mapped.userName,
              staffEmail: mapped.userEmail,
              title: mapped.title,
              issueType: mapped.issueType,
              resolutionSummary: mapped.resolutionSummary || "Completed by IT specialist.",
              techNotes: mapped.techNotes || "",
              resolvedAt: mapped.resolvedAt || new Date().toISOString(),
              resolverName: user.name,
              deviceName: resolvedItem?.name,
            }),
            `Ticket resolution email [${mapped.ticketNumber}]`
          );
        }
      } catch (notifErr) {
        console.warn("Notification dispatch to staff failed:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Ticket ${currentComplaint.ticket_number} updated to ${mapped.status}.`,
      complaint: mapped,
    });
  } catch (error) {
    console.error("Tech complaint PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error updating complaint" },
      { status: 500 }
    );
  }
}
