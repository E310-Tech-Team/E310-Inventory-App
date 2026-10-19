import { NewComplaintEmailData } from "../types";
import { escapeHtml, renderEmailLayout } from "./base";

export function generateNewComplaintEmail(data: NewComplaintEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const {
    ticketNumber,
    staffName,
    staffEmail,
    staffDepartment,
    title,
    description,
    issueType,
    priority,
    deviceName,
    serialNumber,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e310-inventory.r4cglobal.org",
  } = data;

  const priorityColors: Record<string, string> = {
    critical: "#dc2626",
    high: "#ea580c",
    medium: "#2563eb",
    low: "#64748b",
  };
  const priorityColor = priorityColors[priority.toLowerCase()] || "#2563eb";

  const subject = `[E310 IT Alert] New Ticket ${ticketNumber} (${priority.toUpperCase()}) - ${title}`;

  const bodyHtml = `
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="6" cellspacing="0" style="font-size: 14px;">
        <tr>
          <td width="30%" style="color: #64748b; font-weight: 500;">Ticket ID:</td>
          <td style="font-weight: 700; color: #0f172a; font-family: monospace;">${escapeHtml(ticketNumber)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Priority:</td>
          <td>
            <span style="display: inline-block; padding: 2px 8px; font-size: 11px; font-weight: 700; text-transform: uppercase; border-radius: 4px; background-color: ${priorityColor}15; color: ${priorityColor};">
              ${escapeHtml(priority.toUpperCase())}
            </span>
          </td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Issue Type:</td>
          <td style="color: #0f172a; font-weight: 600;">${escapeHtml(issueType)}</td>
        </tr>
        <tr>
          <td style="color: #64748b; font-weight: 500;">Reported By:</td>
          <td style="color: #0f172a;">
            <strong>${escapeHtml(staffName)}</strong> (${escapeHtml(staffEmail)})
            ${staffDepartment ? `<span style="color: #64748b;"> &bull; ${escapeHtml(staffDepartment)}</span>` : ""}
          </td>
        </tr>
        ${deviceName ? `
          <tr>
            <td style="color: #64748b; font-weight: 500;">Assigned Device:</td>
            <td style="color: #0f172a;">
              <strong>${escapeHtml(deviceName)}</strong>
              ${serialNumber ? `<span style="color: #64748b; font-family: monospace;"> (S/N: ${escapeHtml(serialNumber)})</span>` : ""}
            </td>
          </tr>
        ` : ""}
      </table>
    </div>

    <div style="margin-bottom: 20px;">
      <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin: 0 0 8px 0;">Description</h3>
      <div style="background-color: #ffffff; border-left: 4px solid #0f172a; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #334155; border-radius: 0 6px 6px 0; background: #f8fafc;">
        ${escapeHtml(description).replace(/\n/g, "<br>")}
      </div>
    </div>
  `;

  const html = renderEmailLayout({
    title: `New Support Ticket Filed`,
    badgeText: `Ticket ${ticketNumber}`,
    badgeColor: priorityColor,
    previewText: `New ${priority.toUpperCase()} priority ticket filed by ${staffName}: ${title}`,
    bodyHtml,
    ctaText: "Open in Tech Command Center",
    ctaUrl: `${appUrl}/tech`,
    appUrl,
  });

  const text = `
[E310 IT Alert] New Ticket ${ticketNumber} (${priority.toUpperCase()})
Title: ${title}

Reported By: ${staffName} (${staffEmail}) ${staffDepartment ? `[${staffDepartment}]` : ""}
Issue Type: ${issueType}
Priority: ${priority.toUpperCase()}
${deviceName ? `Device: ${deviceName} ${serialNumber ? `(S/N: ${serialNumber})` : ""}\n` : ""}
Description:
${description}

Review and assign this ticket in the Tech Command Center:
${appUrl}/tech
  `.trim();

  return { subject, html, text };
}
