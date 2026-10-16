import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Strict acceptance criteria: Only super-admin can assign / reassign tickets
    if (user.role !== "super-admin") {
      return NextResponse.json(
        { error: "Forbidden: Only Super Admins can delegate or reassign tickets" },
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

    const { assignedTechId, notes } = body;

    if (!assignedTechId || typeof assignedTechId !== "string" || assignedTechId.trim().length === 0) {
      return NextResponse.json(
        { error: "Technician ID (assignedTechId) is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdminClient();

    // 1. Verify target complaint exists
    const { data: ticket, error: ticketError } = await supabase
      .from("device_complaints")
      .select("id, ticket_number, title, issue_type, status, user_id, assigned_tech_id, tech_notes")
      .eq("id", id)
      .single();

    if (ticketError || !ticket) {
      return NextResponse.json(
        { error: "Ticket not found" },
        { status: 404 }
      );
    }

    // 2. Verify technician exists and is a tech team member
    const { data: technician, error: techError } = await supabase
      .from("department_users")
      .select("id, name, email, role, status")
      .eq("id", assignedTechId.trim())
      .single();

    if (techError || !technician) {
      return NextResponse.json(
        { error: "Assigned technician not found in user directory" },
        { status: 404 }
      );
    }

    if (technician.role !== "super-admin" && technician.role !== "team-member") {
      return NextResponse.json(
        { error: "Selected user is not an authorized Tech Team member" },
        { status: 400 }
      );
    }

    if (technician.status !== "active") {
      return NextResponse.json(
        { error: `Cannot assign ticket to ${technician.status} technician account` },
        { status: 400 }
      );
    }

    // 3. Prepare update payload
    const trimmedNotes = notes ? String(notes).trim() : "";
    const delegationNote = trimmedNotes
      ? `[Delegated to ${technician.name} by ${user.name}: ${trimmedNotes}]`
      : `[Assigned to ${technician.name} by ${user.name}]`;

    const nextStatus =
      ticket.status === "submitted" ? "under-review" : ticket.status;

    const existingTechNotes = ticket.tech_notes || "";
    const updatedTechNotes = existingTechNotes
      ? `${existingTechNotes}\n${delegationNote}`
      : delegationNote;

    // 4. Update complaint
    const { data: updatedTicket, error: updateError } = await supabase
      .from("device_complaints")
      .update({
        assigned_tech_id: technician.id,
        status: nextStatus,
        tech_notes: updatedTechNotes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Failed to update complaint assignment:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 5. Create internal notification for assigned technician
    try {
      await supabase.from("notifications").insert({
        recipient_id: technician.id,
        title: "New Hardware Ticket Assigned",
        message: `You have been assigned ticket ${ticket.ticket_number}: ${ticket.title || ticket.issue_type}. Assigned by ${user.name}.`,
        notification_type: "complaint_assigned",
        link_url: `/tech`,
        is_read: false,
        email_sent: false,
      });
    } catch (notifErr) {
      console.warn("Failed to notify assigned technician:", notifErr);
    }

    // 6. Create status notification for submitting staff member
    if (ticket.user_id) {
      try {
        await supabase.from("notifications").insert({
          recipient_id: ticket.user_id,
          title: "Specialist Assigned to Ticket",
          message: `IT Specialist ${technician.name} has been assigned to investigate your ticket (${ticket.ticket_number}).`,
          notification_type: "complaint_status_changed",
          link_url: `/staff`,
          is_read: false,
          email_sent: false,
        });
      } catch (staffNotifErr) {
        console.warn("Failed to notify submitting staff member:", staffNotifErr);
      }
    }

    // 7. Record delegation event in audit_logs
    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: "complaint_delegated",
        entity_type: "complaint",
        entity_id: ticket.id,
        details: {
          ticketNumber: ticket.ticket_number,
          previousTechId: ticket.assigned_tech_id,
          newTechId: technician.id,
          technicianName: technician.name,
          technicianEmail: technician.email,
          delegatedBy: user.name,
          notes: trimmedNotes || null,
          statusTransition: {
            from: ticket.status,
            to: nextStatus,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Failed to log delegation in audit_logs:", auditErr);
    }

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticket.ticket_number} successfully assigned to ${technician.name}`,
      ticket: updatedTicket,
      assignedTechnician: {
        id: technician.id,
        name: technician.name,
        email: technician.email,
        role: technician.role,
      },
    });
  } catch (error) {
    console.error("POST /api/tech/complaints/[id]/assign error:", error);
    return NextResponse.json(
      { error: "Internal server error assigning ticket" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return POST(request, context);
}
