"use client";

import { useEffect, useState } from "react";
import {
  X,
  UserCheck,
  Laptop,
  Mail,
  Building2,
  Calendar,
  Check,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Copy,
  Paperclip,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Admin, DeviceComplaint, ComplaintPriority } from "@/types";
import {
  PriorityCriticalIcon,
  PriorityHighIcon,
  PriorityMediumIcon,
  PriorityLowIcon,
} from "@/components/common/Icons";
import { Button } from "@/components/common/Button";

interface TicketInspectorDrawerProps {
  ticket: DeviceComplaint | null;
  admin: Admin;
  updating: boolean;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, nextStatus: string, notes?: string) => Promise<void>;
  onUpdatePriority: (ticketId: string, nextPriority: ComplaintPriority) => Promise<void>;
  onOpenAssign: (ticket: DeviceComplaint) => void;
}

const PIPELINE_STEPS = [
  {
    id: "submitted",
    step: 1,
    label: "Submitted",
    desc: "Logged in intake queue",
  },
  {
    id: "under-review",
    step: 2,
    label: "Triage & Review",
    desc: "Assigned & assessed",
  },
  {
    id: "in-repair",
    step: 3,
    label: "In Repair",
    desc: "Bench work active",
  },
  {
    id: "resolved",
    step: 4,
    label: "Resolved",
    desc: "Serviced & closed",
  },
];

function getStageNumber(status?: string): number {
  switch ((status || "").toLowerCase()) {
    case "submitted":
    case "pending":
      return 1;
    case "under-review":
    case "assigned":
      return 2;
    case "in-repair":
    case "in-progress":
    case "waiting-parts":
      return 3;
    case "resolved":
    case "closed":
      return 4;
    default:
      return 1;
  }
}

function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return "Recently";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Recently";
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function TicketInspectorContent({
  ticket,
  admin,
  updating,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onOpenAssign,
}: {
  ticket: DeviceComplaint;
  admin: Admin;
  updating: boolean;
  onClose: () => void;
  onUpdateStatus: (ticketId: string, nextStatus: string, notes?: string) => Promise<void>;
  onUpdatePriority: (ticketId: string, nextPriority: ComplaintPriority) => Promise<void>;
  onOpenAssign: (ticket: DeviceComplaint) => void;
}) {
  const [resolutionNotes, setResolutionNotes] = useState(
    () => ticket.resolutionSummary || ticket.techNotes || ""
  );
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const currentStage = getStageNumber(ticket.status);
  const isResolved = ticket.status === "resolved" || ticket.status === "closed";

  const PriorityIcon =
    ticket.priority === "critical"
      ? PriorityCriticalIcon
      : ticket.priority === "high"
      ? PriorityHighIcon
      : ticket.priority === "medium"
      ? PriorityMediumIcon
      : PriorityLowIcon;

  const handleCopyTicketNumber = () => {
    navigator.clipboard.writeText(ticket.ticketNumber);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  return (
    <div className="pointer-events-auto relative w-screen max-w-full sm:max-w-xl h-screen h-[100dvh] bg-surface shadow-2xl flex flex-col sm:border-l border-border/80 text-foreground">
      {/* Header */}
      <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/70 bg-surface flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={handleCopyTicketNumber}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-elevated border border-border/70 text-xs font-mono font-semibold text-foreground hover:border-brand-teal/50 transition-colors cursor-pointer"
            title="Copy ticket number"
          >
            <span>{ticket.ticketNumber}</span>
            {copiedId ? (
              <Check className="w-3 h-3 text-emerald-500" />
            ) : (
              <Copy className="w-3 h-3 text-muted" />
            )}
          </button>

          {isResolved ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Resolved
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-teal/10 text-brand-teal border border-brand-teal/20 capitalize">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-teal" />
              {ticket.status.replace(/-/g, " ")}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-elevated hover:text-foreground transition-colors cursor-pointer"
          title="Close inspector (Esc)"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Inspector Body */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 sm:py-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] space-y-4 sm:space-y-6 overscroll-contain">
        {/* Title & Meta */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {ticket.issueType && (
              <span className="text-xs font-medium text-muted">
                {ticket.issueType}
              </span>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-muted">Priority:</span>
              <div className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-surface-elevated/60 px-2 py-1">
                <PriorityIcon className="w-3.5 h-3.5" />
                <select
                  value={ticket.priority}
                  disabled={updating || isResolved}
                  onChange={(e) =>
                    onUpdatePriority(ticket.id, e.target.value as ComplaintPriority)
                  }
                  className="bg-transparent text-xs font-semibold text-foreground focus:outline-hidden capitalize cursor-pointer disabled:cursor-default disabled:opacity-75"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </div>

          <h2 className="text-lg font-bold text-foreground tracking-tight leading-snug">
            {ticket.title}
          </h2>

          <div className="flex items-center gap-1.5 text-xs text-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span>Reported {formatDateTime(ticket.createdAt)}</span>
          </div>
        </div>

        {/* Staff Description */}
        <div className="space-y-2">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Issue Description
          </h3>
          <div className="rounded-xl border border-border/70 bg-surface-elevated/40 p-4 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {ticket.description || "No detailed description provided by staff member."}
          </div>
        </div>

        {/* Attached Evidence Photos */}
        {ticket.attachmentUrls && ticket.attachmentUrls.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5" />
              <span>Attachments ({ticket.attachmentUrls.length})</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {ticket.attachmentUrls.map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-video rounded-xl overflow-hidden border border-border/70 bg-surface-elevated hover:border-brand-teal/50 transition-colors"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- User-uploaded evidence preview from arbitrary local/remote URLs */}
                  <img
                    src={url}
                    alt={`Attachment ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <span className="absolute bottom-1.5 right-1.5 p-1 rounded-md bg-background/80 backdrop-blur-xs text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="w-3 h-3" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Requester & Device Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Requester Card */}
          <div className="rounded-xl border border-border/70 bg-surface p-3.5 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
              Reported By
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground">{ticket.userName}</p>
              {ticket.userDepartment && (
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <Building2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{ticket.userDepartment}</span>
                </p>
              )}
              {ticket.userEmail && (
                <p className="text-xs text-muted flex items-center gap-1.5">
                  <Mail className="w-3 h-3 shrink-0" />
                  <span className="truncate">{ticket.userEmail}</span>
                </p>
              )}
            </div>
          </div>

          {/* Asset Card */}
          <div className="rounded-xl border border-border/70 bg-surface p-3.5 space-y-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block">
              Affected Asset
            </span>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-brand-teal shrink-0" />
                <span className="truncate">
                  {ticket.itemName || ticket.deviceSummary || "General / Software"}
                </span>
              </p>
              {ticket.itemSerial ? (
                <p className="text-xs text-muted font-mono">
                  SN: {ticket.itemSerial}
                </p>
              ) : (
                <p className="text-xs text-muted">No linked hardware serial</p>
              )}
            </div>
          </div>
        </div>

        {/* Technician Assignment */}
        <div className="rounded-xl border border-border/70 bg-surface p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal shrink-0">
              <UserCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] font-medium text-muted block">
                Assigned Specialist
              </span>
              <p className="text-xs font-semibold text-foreground truncate">
                {ticket.assignedTechName || "Unassigned — awaiting specialist"}
              </p>
            </div>
          </div>

          {admin.role === "super-admin" && !isResolved && (
            <button
              type="button"
              onClick={() => onOpenAssign(ticket)}
              className="px-3 py-1.5 rounded-lg border border-border bg-surface-elevated/60 hover:bg-surface-elevated text-xs font-semibold text-foreground transition-colors cursor-pointer shrink-0"
            >
              {ticket.assignedTechId ? "Reassign" : "Assign"}
            </button>
          )}
        </div>

        {/* Resolution Banner if already resolved */}
        {isResolved ? (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold">
                  Resolved {ticket.resolvedAt ? `on ${formatDateTime(ticket.resolvedAt)}` : ""}
                </span>
              </div>
            </div>
            {(ticket.resolutionSummary || ticket.techNotes) && (
              <p className="text-xs text-foreground/85 leading-relaxed bg-surface/80 rounded-lg p-3 border border-emerald-500/15">
                {ticket.resolutionSummary || ticket.techNotes}
              </p>
            )}
            <div className="pt-1">
              <button
                type="button"
                disabled={updating}
                onClick={() => onUpdateStatus(ticket.id, "under-review")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen ticket & return to active queue</span>
              </button>
            </div>
          </div>
        ) : (
          /* Active Workflow Pipeline */
          <div className="space-y-3 pt-2 border-t border-border/60">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Service Workflow Stage
              </h3>
              {updating && (
                <span className="inline-flex items-center gap-1 text-xs text-brand-teal font-medium">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Saving...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {PIPELINE_STEPS.map((stage) => {
                const isCurrent = currentStage === stage.step;
                const isCompleted = currentStage > stage.step;

                return (
                  <button
                    key={stage.id}
                    type="button"
                    disabled={updating}
                    onClick={() => {
                      if (stage.id === "resolved") {
                        setShowResolveForm(true);
                      } else {
                        setShowResolveForm(false);
                        onUpdateStatus(ticket.id, stage.id);
                      }
                    }}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                      isCurrent
                        ? "border-brand-teal/60 bg-brand-teal/10 ring-1 ring-brand-teal/25"
                        : isCompleted
                        ? "border-emerald-500/30 bg-emerald-500/[0.05] text-foreground/80"
                        : "border-border/70 bg-surface hover:bg-surface-elevated/70"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono text-muted">0{stage.step}</span>
                      {isCompleted ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : isCurrent ? (
                        <span className="w-2 h-2 rounded-full bg-brand-teal" />
                      ) : null}
                    </div>
                    <p className="text-xs font-semibold text-foreground leading-tight">
                      {stage.label}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Inline Resolution Completion Panel */}
            {showResolveForm ? (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04] p-4 space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Resolution Summary & Notes
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowResolveForm(false)}
                    className="text-xs text-muted hover:text-foreground cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Describe the fix applied (e.g., replaced battery cell, updated OS patches, verified system stability)..."
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-brand-teal focus:outline-hidden focus:ring-1 focus:ring-brand-teal"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-muted flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Ticket will move to Resolved Archive
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={updating}
                    onClick={async () => {
                      await onUpdateStatus(ticket.id, "resolved", resolutionNotes);
                    }}
                    leftIcon={
                      updating ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )
                    }
                  >
                    {updating ? "Resolving..." : "Complete & Resolve"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-2 flex items-center justify-end">
                <Button
                  variant="primary"
                  size="sm"
                  disabled={updating}
                  onClick={() => setShowResolveForm(true)}
                  leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Mark as Resolved
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function TicketInspectorDrawer({
  ticket,
  admin,
  updating,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onOpenAssign,
}: TicketInspectorDrawerProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && ticket) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [ticket, onClose]);

  if (!ticket) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 z-50 flex max-w-full pl-0 sm:pl-12 h-screen h-[100dvh] pointer-events-none">
        <TicketInspectorContent
          key={ticket.id}
          ticket={ticket}
          admin={admin}
          updating={updating}
          onClose={onClose}
          onUpdateStatus={onUpdateStatus}
          onUpdatePriority={onUpdatePriority}
          onOpenAssign={onOpenAssign}
        />
      </div>
    </div>
  );
}
