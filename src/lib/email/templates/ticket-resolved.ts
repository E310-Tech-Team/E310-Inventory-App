import { TicketResolvedEmailData } from "../types";
import { escapeHtml, renderEmailLayout } from "./base";

export function generateTicketResolvedEmail(data: TicketResolvedEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    ticketNumber,
    staffName,
    title,
    issueType,
    resolutionSummary,
    techNotes,
    resolvedAt,
    resolverName,
    deviceName,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e310-inventory.r4cglobal.org",
  } = data;

  const formattedDate = new Date(resolvedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const subject = `[E310 Support] Ticket Resolved: ${ticketNumber} - ${title}`;

  const bodyHtml = `
    <p style="font-size: 15px; line-height: 1.5; color: #334155; margin-top: 0;">
      Hello <strong>${escapeHtml(staffName)}</strong>,
    </p>
    <p style="font-size: 15px; line-height: 1.5; color: #334155;">
      Your hardware support ticket <strong>${escapeHtml(ticketNumber)}</strong> has been marked as <strong>Resolved</strong> by the IT Tech Team.
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
        ${deviceName ? `
          <tr>
            <td style="color: #64748b; font-weight: 500;">Device:</td>
            <td style="color: #0f172a;">${escapeHtml(deviceName)}</td>
          </tr>
        ` : ""}
        <tr>
          <td style="color: #64748b; font-weight: 500;">Resolved By:</td>
          <td style="color: #0f172a;"><strong>${escapeHtml(resolverName)}</strong></td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Resolved At:</td>
          <td style="color: #0f172a;">${escapeHtml(formattedDate)}</td>
        </tr>
      </table>
    </div>

    ${resolutionSummary ? `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #059669; margin: 0 0 8px 0;">Resolution Summary</h3>
        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #065f46; border-radius: 0 6px 6px 0;">
          ${escapeHtml(resolutionSummary).replace(/\n/g, "<br>")}
        </div>
      </div>
    ` : ""}

    ${techNotes ? `
      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px 0;">Technical Notes</h3>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; font-size: 13px; line-height: 1.5; color: #475569; border-radius: 6px;">
          ${escapeHtml(techNotes).replace(/\n/g, "<br>")}
        </div>
      </div>
    ` : ""}

    <p style="font-size: 14px; color: #475569; line-height: 1.5;">
      If your hardware issue is not fully addressed or recurs, you can re-open this ticket or contact the Tech Support team directly from the Staff Portal.
    </p>
  `;

  const html = renderEmailLayout({
    title: `Ticket Resolved: ${title}`,
    badgeText: `Resolved`,
    badgeColor: "#10b981",
    previewText: `Ticket ${ticketNumber} has been resolved by ${resolverName}`,
    bodyHtml,
    ctaText: "Review Ticket in Staff Portal",
    ctaUrl: `${appUrl}/staff`,
    appUrl,
  });

  const text = `
Hello ${staffName},
Your support ticket ${ticketNumber} has been marked as Resolved by ${resolverName}.

Ticket: ${ticketNumber} - ${title}
Category: ${issueType}
Resolved At: ${formattedDate}
${resolutionSummary ? `\nResolution Summary:\n${resolutionSummary}\n` : ""}
Review this ticket in your Staff Portal:
${appUrl}/staff
  `.trim();

  return { subject, html, text };
}
