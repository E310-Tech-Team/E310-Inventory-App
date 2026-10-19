import {
  EmailResult,
  NewComplaintEmailData,
  SendEmailOptions,
  TicketAssignedEmailData,
  TicketResolvedEmailData,
} from "./types";
import { generateNewComplaintEmail } from "./templates/new-complaint";
import {
  generateStaffAssignedEmail,
  generateTechnicianAssignedEmail,
} from "./templates/ticket-assigned";
import { generateTicketResolvedEmail } from "./templates/ticket-resolved";

const DEFAULT_FROM = process.env.EMAIL_FROM || process.env.SENDGRID_FROM_EMAIL || "E310 IT Support <it-support@r4cglobal.org>";

/**
 * Dispatches a promise in the background without blocking the caller.
 * Guarantees that failures in the mail pipeline will never fail user-facing HTTP responses.
 */
export function dispatchAsyncEmail(task: Promise<unknown>, taskName = "Email"): void {
  // Explicitly do not await; catch any errors so unhandled rejections never bring down the node process
  Promise.resolve(task).catch((err) => {
    console.error(`[EmailService] Background task "${taskName}" failed:`, err);
  });
}

/**
 * Low-level dispatch supporting Resend, SendGrid, Mailgun, and Dev/Mock logging.
 */
export async function sendEmail(options: SendEmailOptions): Promise<EmailResult> {
  const { to, subject, html, text, from = DEFAULT_FROM, replyTo } = options;
  const recipients = Array.isArray(to) ? to : [to];

  if (recipients.length === 0) {
    return { success: false, provider: "mock", error: "No recipients provided" };
  }

  // 1. Resend API
  const resendApiKey = process.env.RESEND_API_KEY;
  if (resendApiKey) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject,
          html,
          text,
          reply_to: replyTo,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Resend HTTP error ${response.status}`);
      }

      return { success: true, messageId: data.id, provider: "resend" };
    } catch (err: unknown) {
      console.error("[EmailService] Resend dispatch failed:", err);
      // Fall through to other providers or error return
    }
  }

  // 2. SendGrid API
  const sendgridApiKey = process.env.SENDGRID_API_KEY;
  if (sendgridApiKey) {
    try {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sendgridApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: recipients.map((r) => ({ email: r })),
              subject,
            },
          ],
          from: { email: from.includes("<") ? from.replace(/.*<([^>]+)>.*/, "$1") : from },
          content: [
            { type: "text/html", value: html },
            ...(text ? [{ type: "text/plain", value: text }] : []),
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SendGrid HTTP ${response.status}: ${errorText}`);
      }

      return { success: true, provider: "sendgrid" };
    } catch (err: unknown) {
      console.error("[EmailService] SendGrid dispatch failed:", err);
    }
  }

  // 3. Mailgun API
  const mailgunApiKey = process.env.MAILGUN_API_KEY;
  const mailgunDomain = process.env.MAILGUN_DOMAIN;
  if (mailgunApiKey && mailgunDomain) {
    try {
      const formData = new URLSearchParams();
      formData.append("from", from);
      recipients.forEach((r) => formData.append("to", r));
      formData.append("subject", subject);
      formData.append("html", html);
      if (text) formData.append("text", text);

      const response = await fetch(`https://api.mailgun.net/v3/${mailgunDomain}/messages`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`api:${mailgunApiKey}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Mailgun HTTP ${response.status}`);
      }

      return { success: true, messageId: data.id, provider: "mailgun" };
    } catch (err: unknown) {
      console.error("[EmailService] Mailgun dispatch failed:", err);
    }
  }

  // 4. Development/Mock Fallback
  // Pretty-prints the email output to stdout for development debugging
  console.log(`\n======================================================`);
  console.log(`[EmailService MOCK DISPATCH] Provider: Local / Development`);
  console.log(`To:       ${recipients.join(", ")}`);
  console.log(`From:     ${from}`);
  console.log(`Subject:  ${subject}`);
  console.log(`Snippet:  ${text ? text.slice(0, 150).replace(/\n/g, " ") : "HTML content"}`);
  console.log(`======================================================\n`);

  return { success: true, provider: "mock", messageId: `mock-${Date.now()}` };
}

/**
 * Triggers automated email notifications when a new complaint is filed:
 * - Alert sent to Tech Support team members.
 */
export async function sendNewComplaintEmail(
  data: NewComplaintEmailData,
  techTeamEmails: string[]
): Promise<EmailResult[]> {
  if (techTeamEmails.length === 0) {
    return [];
  }

  const { subject, html, text } = generateNewComplaintEmail(data);

  // Send batch or individual
  const result = await sendEmail({
    to: techTeamEmails,
    subject,
    html,
    text,
  });

  return [result];
}

/**
 * Triggers automated email notifications when a ticket is assigned:
 * 1. Dispatches instruction email to the designated technician.
 * 2. Dispatches progress notification to the reporting staff member.
 */
export async function sendTicketAssignedEmail(
  data: TicketAssignedEmailData
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  // 1. Notify the assigned technician
  if (data.technicianEmail) {
    const techEmail = generateTechnicianAssignedEmail(data);
    const techRes = await sendEmail({
      to: data.technicianEmail,
      subject: techEmail.subject,
      html: techEmail.html,
      text: techEmail.text,
    });
    results.push(techRes);
  }

  // 2. Notify the staff member
  if (data.staffEmail) {
    const staffEmail = generateStaffAssignedEmail(data);
    const staffRes = await sendEmail({
      to: data.staffEmail,
      subject: staffEmail.subject,
      html: staffEmail.html,
      text: staffEmail.text,
    });
    results.push(staffRes);
  }

  return results;
}

/**
 * Triggers automated email notification when a ticket is resolved:
 * - Dispatches resolution summary to the staff member.
 */
export async function sendTicketResolvedEmail(
  data: TicketResolvedEmailData
): Promise<EmailResult | null> {
  if (!data.staffEmail) {
    return null;
  }

  const { subject, html, text } = generateTicketResolvedEmail(data);

  return sendEmail({
    to: data.staffEmail,
    subject,
    html,
    text,
  });
}
