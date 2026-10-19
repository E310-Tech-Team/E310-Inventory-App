import { TicketAssignedEmailData } from "../types";
import { escapeHtml, renderEmailLayout } from "./base";

export function generateTechnicianAssignedEmail(data: TicketAssignedEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    ticketNumber,
    technicianName,
    staffName,
    staffEmail,
    title,
    issueType,
    priority,
    triageNotes,
    assignedByName,
    deviceName,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e310-inventory.r4cglobal.org",
  } = data;

  const subject = `[E310 IT Dispatch] Assigned to Ticket ${ticketNumber}: ${title}`;

  const bodyHtml = `
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">
      Hello <strong>${escapeHtml(technicianName)}</strong>, you have been designated as the primary IT specialist for support ticket <strong>${escapeHtml(ticketNumber)}</strong> by ${escapeHtml(assignedByName)}.
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td width="30%" style="color: #64748b; font-weight: 500;">Ticket ID:</td>
          <td style="font-weight: 700; color: #0f172a; font-family: monospace;">${escapeHtml(ticketNumber)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Title:</td>
          <td style="font-weight: 600; color: #0f172a;">${escapeHtml(title)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Category:</td>
          <td style="color: #0f172a;">${escapeHtml(issueType)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Priority:</td>
          <td style="font-weight: 600; text-transform: uppercase; color: #2563eb;">${escapeHtml(priority)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Staff Member:</td>
          <td style="color: #0f172a;"><strong>${escapeHtml(staffName)}</strong> (${escapeHtml(staffEmail)})</td>
        </tr>
        ${deviceName ? `
          <tr>
            <td style="color: #64748b; font-weight: 500;">Equipment:</td>
            <td style="color: #0f172a;">${escapeHtml(deviceName)}</td>
          </tr>
        ` : ""}
      </table>
    </div>

    ${triageNotes ? `
      <div style="margin-bottom: 24px;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px 0;">Supervisor Triage Instructions</h3>
        <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #1e40af; border-radius: 0 6px 6px 0;">
          ${escapeHtml(triageNotes).replace(/\n/g, "<br>")}
        </div>
      </div>
    ` : ""}

    <p style="font-size: 14px; color: #64748b; margin-bottom: 0;">
      Please inspect the asset, liaise with ${escapeHtml(staffName)}, and update ticket progress in your Command Center queue.
    </p>
  `;

  const html = renderEmailLayout({
    title: `Ticket Assignment: ${title}`,
    badgeText: `Assigned to You`,
    badgeColor: "#2563eb",
    previewText: `You have been assigned ticket ${ticketNumber}: ${title}`,
    bodyHtml,
    ctaText: "Open Ticket in Command Center",
    ctaUrl: `${appUrl}/tech`,
    appUrl,
  });

  const text = `
Hello ${technicianName},
You have been designated as the primary IT specialist for support ticket ${ticketNumber} by ${assignedByName}.

Ticket: ${ticketNumber} - ${title}
Category: ${issueType}
Priority: ${priority.toUpperCase()}
Staff Member: ${staffName} (${staffEmail})
${deviceName ? `Equipment: ${deviceName}\n` : ""}${triageNotes ? `Triage Instructions:\n${triageNotes}\n\n` : ""}
Open the ticket to investigate and record technician notes:
${appUrl}/tech
  `.trim();

  return { subject, html, text };
}

export function generateStaffAssignedEmail(data: TicketAssignedEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    ticketNumber,
    technicianName,
    staffName,
    title,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e310-inventory.r4cglobal.org",
  } = data;

  const subject = `[E310 Support] IT Specialist Assigned to Ticket ${ticketNumber}`;

  const bodyHtml = `
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">
      Hello <strong>${escapeHtml(staffName)}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 1.5; color: #334155;">
      An IT specialist has been assigned to investigate your hardware ticket:
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td width="30%" style="color: #64748b; font-weight: 500;">Ticket ID:</td>
          <td style="font-weight: 700; color: #0f172a; font-family: monospace;">${escapeHtml(ticketNumber)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Title:</td>
          <td style="font-weight: 600; color: #0f172a;">${escapeHtml(title)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Assigned Specialist:</td>
          <td style="font-weight: 700; color: #059669;">${escapeHtml(technicianName)} (E310 IT Team)</td>
        </tr>
      </table>
    </div>

    <p style="font-size: 14px; color: #475569; line-height: 1.5;">
      Our specialist will review your issue and reach out if device diagnostic or physical inspection is needed. You can track real-time progress in your Staff Portal.
    </p>
  `;

  const html = renderEmailLayout({
    title: `Specialist Dispatched`,
    badgeText: `In Progress`,
    badgeColor: "#059669",
    previewText: `IT Specialist ${technicianName} is investigating ticket ${ticketNumber}`,
    bodyHtml,
    ctaText: "View Ticket in Staff Portal",
    ctaUrl: `${appUrl}/staff`,
    appUrl,
  });

  const text = `
Hello ${staffName},
An IT specialist has been assigned to investigate your hardware ticket:

Ticket: ${ticketNumber} - ${title}
Assigned Specialist: ${technicianName}

You can track real-time progress in your Staff Portal:
${appUrl}/staff
  `.trim();

  return { subject, html, text };
}
