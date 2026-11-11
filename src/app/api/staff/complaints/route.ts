import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getSupabaseAdminClient, hasSupabaseConfig } from "@/lib/supabase/server";
import { dispatchAsyncEmail, sendNewComplaintEmail } from "@/lib/email/service";

export async function GET() {
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

    const supabase = getSupabaseAdminClient();

    // Query complaints for the requesting user only
    const { data: rawComplaints, error } = await supabase
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
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching staff complaints:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const complaints = (rawComplaints ?? []).map((c: any) => ({
      id: c.id,
      ticket_number: c.ticket_number,
      ticketNumber: c.ticket_number,
      user_id: c.user_id,
      userId: c.user_id,
      user_name: c.submitter?.name ?? user.name,
      userName: c.submitter?.name ?? user.name,
      user_email: c.submitter?.email ?? user.email,
      userEmail: c.submitter?.email ?? user.email,
      user_department: c.submitter?.department ?? user.department,
      userDepartment: c.submitter?.department ?? user.department,
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
    console.error("Staff complaints GET error:", error);
    return NextResponse.json(
      { error: "Internal server error fetching complaints" },
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

    const {
      title,
      description,
      issueType,
      itemId,
      priority = "medium",
      attachmentUrls = [],
    } = body;

    // Validation
    if (!title || typeof title !== "string" || title.trim().length === 0) {
      return NextResponse.json({ error: "Issue title is required" }, { status: 400 });
    }

    if (!description || typeof description !== "string" || description.trim().length === 0) {
      return NextResponse.json({ error: "Issue description is required" }, { status: 400 });
    }

    if (!issueType || typeof issueType !== "string" || issueType.trim().length === 0) {
      return NextResponse.json({ error: "Issue category/type is required" }, { status: 400 });
    }

    const sanitizedAttachments = Array.isArray(attachmentUrls)
      ? attachmentUrls.map((u) => String(u).trim()).filter(Boolean)
      : [];

    if (sanitizedAttachments.length === 0) {
      return NextResponse.json(
        { error: "At least one evidence / photo attachment is compulsory to submit an issue ticket." },
        { status: 400 }
      );
    }

    const validPriorities = ["low", "medium", "high", "critical"];
    const sanitizedPriority = validPriorities.includes(priority) ? priority : "medium";

    const supabase = getSupabaseAdminClient();

    // 1. Insert complaint into public.device_complaints
    // Note: ticket_number is auto-generated by the DB default expression
    const { data: newComplaint, error: insertError } = await supabase
      .from("device_complaints")
      .insert({
        user_id: user.id,
        item_id: itemId || null,
        device_summary: `${title.trim()} (${issueType.trim()})`,
        title: title.trim(),
        description: description.trim(),
        issue_type: issueType.trim(),
        severity: sanitizedPriority,
        status: "submitted",
        attachment_urls: sanitizedAttachments,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert complaint ticket:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    const ticketNumber = newComplaint.ticket_number;

    // 2. Audit log creation
    try {
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        actor_name: user.name,
        action_type: "complaint_logged",
        entity_type: "device_complaint",
        entity_id: newComplaint.id,
        details: {
          ticketNumber,
          title: newComplaint.title,
          issueType: newComplaint.issue_type,
          priority: newComplaint.severity,
          itemId: newComplaint.item_id,
        },
      });
    } catch (auditErr) {
      console.warn("Failed to create audit log for complaint submission:", auditErr);
    }

    // 3. Notify tech team members of new complaint ticket
    try {
      const { data: techMembers } = await supabase
        .from("department_users")
        .select("id, email, name")
        .in("role", ["super-admin", "team-member"])
        .eq("status", "active");

      if (techMembers && techMembers.length > 0) {
        const notifications = techMembers.map((tech) => ({
          recipient_id: tech.id,
          title: `New Ticket [${ticketNumber}]`,
          message: `${user.name} reported: "${newComplaint.title}" (${newComplaint.issue_type})`,
          notification_type: "complaint_logged",
          link_url: `/tech`,
          is_read: false,
          email_sent: true,
        }));

        await supabase.from("notifications").insert(notifications);

        // Fetch equipment name if linked
        let deviceName: string | null = null;
        let serialNumber: string | null = null;
        if (newComplaint.item_id) {
          const { data: item } = await supabase
            .from("items")
            .select("name, serial_number, identifier_value")
            .eq("id", newComplaint.item_id)
            .maybeSingle();
          if (item) {
            deviceName = item.name;
            serialNumber = item.serial_number || item.identifier_value;
          }
        }

        // Asynchronously dispatch email alerts to all tech support specialists
        const techEmails = techMembers
          .map((m) => m.email)
          .filter((e): e is string => Boolean(e && e.includes("@")));

        if (techEmails.length > 0) {
          dispatchAsyncEmail(
            sendNewComplaintEmail(
              {
                ticketNumber,
                staffName: user.name,
                staffEmail: user.email,
                staffDepartment: user.department,
                title: newComplaint.title,
                description: newComplaint.description,
                issueType: newComplaint.issue_type,
                priority: newComplaint.priority,
                deviceName,
                serialNumber,
              },
              techEmails
            ),
            `New complaint alert [${ticketNumber}]`
          );
        }
      }
    } catch (techNotifErr) {
      console.warn("Failed to notify tech members of new complaint:", techNotifErr);
    }

    // 4. Create confirmation notification for the reporting staff member
    try {
      await supabase.from("notifications").insert({
        recipient_id: user.id,
        title: `Ticket Logged [${ticketNumber}]`,
        message: `Your support request "${newComplaint.title}" has been registered and is pending IT triage.`,
        notification_type: "complaint_logged",
        link_url: `/staff`,
        is_read: false,
        email_sent: true,
      });
    } catch (staffNotifErr) {
      console.warn("Failed to notify staff member of ticket confirmation:", staffNotifErr);
    }

    const mappedComplaint = {
      ...newComplaint,
      ticketNumber: newComplaint.ticket_number,
      createdAt: newComplaint.created_at,
      updatedAt: newComplaint.updated_at,
      issueType: newComplaint.issue_type,
      priority: newComplaint.severity,
      severity: newComplaint.severity,
      attachmentUrls: newComplaint.attachment_urls ?? [],
      itemId: newComplaint.item_id,
      userId: newComplaint.user_id,
      deviceSummary: newComplaint.device_summary,
    };

    return NextResponse.json(
      {
        success: true,
        message: `Ticket ${ticketNumber} registered successfully.`,
        complaint: mappedComplaint,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Complaint creation error:", error);
    return NextResponse.json(
      { error: "Internal server error submitting complaint ticket" },
      { status: 500 }
    );
  }
}
