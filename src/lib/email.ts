const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || process.env.BASE_URL || "http://localhost:3000";

function getBaseAppUrl(): string {
  return APP_URL.endsWith("/") ? APP_URL.slice(0, -1) : APP_URL;
}

function inviteUrlFor(email: string): string {
  return `${getBaseAppUrl()}/signup?email=${encodeURIComponent(email.toLowerCase())}`;
}

async function sendSendGridInvite(email: string, invitedBy: string, inviteUrl: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;
  const fromName = process.env.SENDGRID_FROM_NAME || "Inventory Admin";

  if (!apiKey || !fromEmail) {
    throw new Error("SendGrid is not configured");
  }

  const payload = {
    personalizations: [
      {
        to: [{ email }],
        subject: "Your inventory access invitation",
      },
    ],
    from: {
      email: fromEmail,
      name: fromName,
    },
    content: [
      {
        type: "text/plain",
        value: `You were invited by ${invitedBy} to join the inventory app.\n\nComplete signup: ${inviteUrl}\n\nIf you did not expect this invitation, ignore this email.`,
      },
      {
        type: "text/html",
        value: `<p>You were invited by ${invitedBy} to join the inventory app.</p><p><a href="${inviteUrl}">Complete signup</a></p><p>If you did not expect this invitation, ignore this email.</p>`,
      },
    ],
  };

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`SendGrid request failed: ${response.status} ${body}`);
  }
}

async function sendMailgunInvite(email: string, invitedBy: string, inviteUrl: string) {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.MAILGUN_FROM_EMAIL;

  if (!apiKey || !domain || !fromEmail) {
    throw new Error("Mailgun is not configured");
  }

  const form = new URLSearchParams();
  form.append("from", fromEmail);
  form.append("to", email);
  form.append("subject", "Your inventory access invitation");
  form.append(
    "text",
    `You were invited by ${invitedBy} to join the inventory app.\n\nComplete signup: ${inviteUrl}\n\nIf you did not expect this invitation, ignore this email.`
  );
  form.append(
    "html",
    `<p>You were invited by ${invitedBy} to join the inventory app.</p><p><a href="${inviteUrl}">Complete signup</a></p><p>If you did not expect this invitation, ignore this email.</p>`
  );

  const response = await fetch(`https://api.mailgun.net/v3/${domain}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`api:${apiKey}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Mailgun request failed: ${response.status} ${body}`);
  }
}

export async function sendInviteEmail(email: string, invitedBy: string): Promise<void> {
  const inviteUrl = inviteUrlFor(email);

  if (process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL) {
    await sendSendGridInvite(email, invitedBy, inviteUrl);
    return;
  }

  if (
    process.env.MAILGUN_API_KEY &&
    process.env.MAILGUN_DOMAIN &&
    process.env.MAILGUN_FROM_EMAIL
  ) {
    await sendMailgunInvite(email, invitedBy, inviteUrl);
    return;
  }

  console.log(
    `[invite-email] no email provider configured. Invite link for ${email}: ${inviteUrl}`
  );
}

export function getInviteUrl(email: string): string {
  return inviteUrlFor(email);
}
