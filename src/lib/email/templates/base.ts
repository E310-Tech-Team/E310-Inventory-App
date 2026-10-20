export interface EmailLayoutOptions {
  title: string;
  badgeText?: string;
  badgeColor?: string; // hex or CSS color
  previewText?: string;
  bodyHtml: string;
  ctaText?: string;
  ctaUrl?: string;
  appUrl?: string;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const {
    title,
    badgeText,
    badgeColor = "#2563eb",
    previewText,
    bodyHtml,
    ctaText,
    ctaUrl,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://e310-inventory.r4cglobal.org",
  } = options;

  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  ${previewText ? `<div style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</div>` : ""}
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      -webkit-font-smoothing: antialiased;
    }
    table {
      border-collapse: collapse;
    }
    img {
      border: 0;
      outline: none;
      text-decoration: none;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    .header {
      background-color: #0f172a;
      padding: 24px 32px;
      text-align: left;
    }
    .brand-title {
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin: 0;
    }
    .brand-subtitle {
      color: #94a3b8;
      font-size: 12px;
      margin-top: 4px;
      margin-bottom: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .content {
      padding: 32px;
    }
    .badge {
      display: inline-block;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-radius: 9999px;
      margin-bottom: 16px;
    }
    .title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .cta-button {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 24px;
      border-radius: 8px;
      margin-top: 24px;
      text-align: center;
    }
    .footer {
      background-color: #f1f5f9;
      padding: 24px 32px;
      text-align: center;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #2563eb;
      text-decoration: none;
    }
  </style>
</head>
<body style="background-color: #f8fafc; padding: 24px 12px; margin: 0;">
  <div class="email-container" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
    <!-- Header -->
    <div style="background-color: #0f172a; padding: 24px 32px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <h1 style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0;">EThree10 Inventory & Support Hub</h1>
            <p style="color: #94a3b8; font-size: 11px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 0.05em;">R4C Global Tech Support Operations</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body Content -->
    <div style="padding: 32px 32px 24px 32px;">
      ${badgeText ? `
        <span style="display: inline-block; padding: 4px 10px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; border-radius: 9999px; background-color: ${badgeColor}20; color: ${badgeColor}; border: 1px solid ${badgeColor}40; margin-bottom: 16px;">
          ${escapeHtml(badgeText)}
        </span>
      ` : ""}
      
      <h2 style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
        ${escapeHtml(title)}
      </h2>

      ${bodyHtml}

      ${ctaText && ctaUrl ? `
        <div style="margin-top: 28px; text-align: left;">
          <a href="${escapeHtml(ctaUrl)}" style="display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 8px;">
            ${escapeHtml(ctaText)} &rarr;
          </a>
        </div>
      ` : ""}
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b; line-height: 1.6;">
      <p style="margin: 0 0 6px 0;">This automated alert was dispatched by the <strong>E310 Inventory & Device Management System</strong>.</p>
      <p style="margin: 0;">
        <a href="${escapeHtml(appUrl)}" style="color: #2563eb; text-decoration: none; font-weight: 500;">Portal Access</a> &bull;
        <a href="${escapeHtml(appUrl)}/staff" style="color: #2563eb; text-decoration: none; font-weight: 500;">Staff Hub</a> &bull;
        <a href="${escapeHtml(appUrl)}/tech" style="color: #2563eb; text-decoration: none; font-weight: 500;">Tech Command Center</a>
      </p>
      <p style="margin: 12px 0 0 0; font-size: 11px; color: #94a3b8;">&copy; ${currentYear} R4C Global. Strictly confidential & internal use only.</p>
    </div>
  </div>
</body>
</html>`;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
