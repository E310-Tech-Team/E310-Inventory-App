export type EmailPriority = "low" | "medium" | "high" | "critical";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  provider: "resend" | "sendgrid" | "mailgun" | "mock";
  error?: string;
}

export interface NewComplaintEmailData {
  ticketNumber: string;
  staffName: string;
  staffEmail: string;
  staffDepartment?: string | null;
  title: string;
  description: string;
  issueType: string;
  priority: EmailPriority | string;
  deviceName?: string | null;
  serialNumber?: string | null;
  appUrl?: string;
}

export interface TicketAssignedEmailData {
  ticketNumber: string;
  technicianName: string;
  technicianEmail: string;
  staffName: string;
  staffEmail: string;
  title: string;
  issueType: string;
  priority: EmailPriority | string;
  triageNotes?: string | null;
  assignedByName: string;
  deviceName?: string | null;
  appUrl?: string;
}

export interface TicketResolvedEmailData {
  ticketNumber: string;
  staffName: string;
  staffEmail: string;
  title: string;
  issueType: string;
  resolutionSummary?: string | null;
  techNotes?: string | null;
  resolvedAt: string;
  resolverName: string;
  deviceName?: string | null;
  appUrl?: string;
}
