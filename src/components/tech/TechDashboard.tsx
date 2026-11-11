"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Inbox,
  Wrench,
  ShieldAlert,
  CheckCircle2,
  Search,
  ChevronRight,
  Laptop,
  Archive,
  History,
  Loader2,
  RotateCcw,
} from "lucide-react";
import {
  PriorityCriticalIcon,
  PriorityHighIcon,
  PriorityMediumIcon,
  PriorityLowIcon,
} from "@/components/common/Icons";
import { Admin, DeviceComplaint, ComplaintPriority, ComplaintStatus } from "@/types";
import { LiveActivityTimeline } from "./LiveActivityTimeline";
import { AssignTicketModal } from "./AssignTicketModal";
import { TicketInspectorDrawer } from "./TicketInspectorDrawer";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";
import { broadcastTicketUpdate, subscribeToTicketUpdates } from "@/lib/sync/ticket-broadcast";
import { formatDateTime, parseTimestamp } from "@/lib/format-date";

type WorkspaceTab = "active" | "archive" | "audit";
type ActiveSubFilter = "all-open" | "submitted" | "triage" | "in-progress" | "urgent";

interface TicketMetrics {
  openQueue: number;
  inProgress: number;
  urgentTickets: number;
  resolvedTickets: number;
}

interface RawComplaintRecord {
  id: string;
  ticket_number?: string;
  ticketNumber?: string;
  user_id?: string;
  userId?: string;
  user_name?: string;
  userName?: string;
  user_email?: string;
  userEmail?: string;
  user_department?: string | null;
  userDepartment?: string | null;
  item_id?: string | null;
  itemId?: string | null;
  item?: { name?: string | null; serial_number?: string | null } | null;
  itemName?: string | null;
  itemSerial?: string | null;
  device_summary?: string;
  deviceSummary?: string;
  title: string;
  description: string;
  issue_type?: string;
  issueType?: string;
  priority?: ComplaintPriority;
  severity?: ComplaintPriority;
  status?: ComplaintStatus;
  attachment_urls?: string[];
  attachmentUrls?: string[];
  assigned_tech_id?: string | null;
  assignedTechId?: string | null;
  assigned_tech?: { name?: string | null } | null;
  assignedTechName?: string | null;
  tech_notes?: string | null;
  techNotes?: string | null;
  resolution_summary?: string | null;
  resolutionSummary?: string | null;
  resolved_at?: string | null;
  resolvedAt?: string | null;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

function mapRawComplaint(c: RawComplaintRecord): DeviceComplaint {
  return {
    id: c.id,
    ticketNumber: c.ticket_number || c.ticketNumber || "",
    userId: c.user_id || c.userId || "",
    userName: c.user_name || c.userName || "Staff Member",
    userEmail: c.user_email || c.userEmail || "",
    userDepartment: c.user_department ?? c.userDepartment ?? null,
    itemId: c.item_id ?? c.itemId ?? null,
    itemName: c.item?.name ?? c.itemName ?? null,
    itemSerial: c.item?.serial_number ?? c.itemSerial ?? null,
    deviceSummary: c.device_summary || c.deviceSummary,
    title: c.title,
    description: c.description,
    issueType: c.issue_type || c.issueType || "",
    priority: c.priority || c.severity || "medium",
    status: c.status || "submitted",
    attachmentUrls: c.attachment_urls || c.attachmentUrls || [],
    assignedTechId: c.assigned_tech_id ?? c.assignedTechId ?? null,
    assignedTechName: c.assigned_tech?.name ?? c.assignedTechName ?? null,
    techNotes: c.tech_notes ?? c.techNotes ?? null,
    resolutionSummary: c.resolution_summary ?? c.resolutionSummary ?? null,
    resolvedAt: c.resolved_at ?? c.resolvedAt ?? null,
    createdAt: c.created_at || c.createdAt || new Date().toISOString(),
    updatedAt: c.updated_at || c.updatedAt || new Date().toISOString(),
  };
}

function isTicketClosed(status?: string): boolean {
  const s = (status || "").toLowerCase();
  return s === "resolved" || s === "closed" || s === "cancelled";
}

function formatRelativeTime(dateStr?: string | null): string {
  const d = parseTimestamp(dateStr);
  if (!d) return "Recently";
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return "Just now";
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function getInitials(name?: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getStageMeta(status?: string) {
  switch ((status || "").toLowerCase()) {
    case "submitted":
    case "pending":
      return {
        label: "Submitted",
        dotClass: "bg-amber-500",
        pillClass:
          "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
      };
    case "under-review":
    case "assigned":
      return {
        label: "Triage & Review",
        dotClass: "bg-purple-500",
        pillClass:
          "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
      };
    case "in-repair":
    case "in-progress":
    case "waiting-parts":
      return {
        label: "In Repair",
        dotClass: "bg-blue-500",
        pillClass:
          "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
      };
    case "resolved":
    case "closed":
      return {
        label: "Resolved",
        dotClass: "bg-emerald-500",
        pillClass:
          "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
      };
    default:
      return {
        label: (status || "Open").replace(/-/g, " "),
        dotClass: "bg-slate-400",
        pillClass: "bg-surface-elevated text-foreground-muted border-border/70",
      };
  }
}

export function TechDashboard({ admin }: { admin: Admin }) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allComplaints, setAllComplaints] = useState<DeviceComplaint[]>([]);

  // Navigation & Filters (Defaulting strictly to Active Queue — resolved tickets excluded)
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("active");
  const [activeSubFilter, setActiveSubFilter] = useState<ActiveSubFilter>("all-open");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileLimit, setMobileLimit] = useState(6);

  // Inspector Drawer & Modals
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [assigningTicket, setAssigningTicket] = useState<DeviceComplaint | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<{
    message: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  const selectedTicket = useMemo(
    () => allComplaints.find((t) => t.id === selectedTicketId) || null,
    [allComplaints, selectedTicketId]
  );

  // Live metrics computed dynamically from all complaints
  const metrics: TicketMetrics = useMemo(() => {
    const openTickets = allComplaints.filter((c) => !isTicketClosed(c.status));
    const inProgressTickets = openTickets.filter(
      (c) =>
        c.status === "in-repair" ||
        c.status === "in-progress" ||
        c.status === "waiting-parts"
    );
    const urgentTickets = openTickets.filter(
      (c) => c.priority === "critical" || c.priority === "high"
    );
    const resolvedTickets = allComplaints.filter((c) => isTicketClosed(c.status));

    return {
      openQueue: openTickets.length,
      inProgress: inProgressTickets.length,
      urgentTickets: urgentTickets.length,
      resolvedTickets: resolvedTickets.length,
    };
  }, [allComplaints]);

  const criticalOpenTickets = useMemo(
    () =>
      allComplaints.filter(
        (c) => c.priority === "critical" && !isTicketClosed(c.status)
      ),
    [allComplaints]
  );

  const showToast = useCallback(
    (message: string, actionLabel?: string, onAction?: () => void) => {
      setStatusToast({ message, actionLabel, onAction });
      setTimeout(() => {
        setStatusToast((prev) => (prev?.message === message ? null : prev));
      }, 5500);
    },
    []
  );

  const loadDashboardData = useCallback(async (showSyncBadge = true) => {
    if (showSyncBadge) {
      setIsRefreshing(true);
    }
    try {
      const complaintsRes = await fetch("/api/tech/complaints").catch(() => null);
      const complaintsData =
        complaintsRes && complaintsRes.ok
          ? await complaintsRes.json()
          : { complaints: [] };
      const rawComplaints: RawComplaintRecord[] = complaintsData.complaints ?? [];
      setAllComplaints(rawComplaints.map(mapRawComplaint));
    } catch (err) {
      console.error("Failed to load service desk tickets:", err);
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function init() {
      try {
        const complaintsRes = await fetch("/api/tech/complaints").catch(() => null);
        const complaintsData =
          complaintsRes && complaintsRes.ok
            ? await complaintsRes.json()
            : { complaints: [] };
        const rawComplaints: RawComplaintRecord[] = complaintsData.complaints ?? [];
        if (active) {
          setAllComplaints(rawComplaints.map(mapRawComplaint));
        }
      } catch (err) {
        console.error("Failed to load service desk tickets:", err);
      } finally {
        if (active) {
          setInitialLoading(false);
        }
      }
    }

    void init();

    const unsubscribe = subscribeToTicketUpdates(() => {
      void loadDashboardData(true);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [loadDashboardData]);

  const handleUpdateStatus = async (
    ticketId: string,
    nextStatus: string,
    notes?: string
  ) => {
    const targetTicket = allComplaints.find((t) => t.id === ticketId);
    const resolving = isTicketClosed(nextStatus);
    const reopening = targetTicket && isTicketClosed(targetTicket.status) && !resolving;

    try {
      setUpdatingTicketId(ticketId);

      // Optimistic state update
      setAllComplaints((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: nextStatus as ComplaintStatus,
                techNotes: notes !== undefined ? notes : t.techNotes,
                resolutionSummary: notes !== undefined ? notes : t.resolutionSummary,
                resolvedAt: resolving
                  ? t.resolvedAt || new Date().toISOString()
                  : reopening
                  ? null
                  : t.resolvedAt,
              }
            : t
        )
      );

      broadcastTicketUpdate(ticketId, nextStatus);

      const res = await fetch(`/api/tech/complaints/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          resolutionNotes: notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update ticket status");
      }

      if (data.complaint) {
        setAllComplaints((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.complaint } : t))
        );
        broadcastTicketUpdate(ticketId, data.complaint.status);
      }

      if (resolving) {
        // Close inspector cleanly and confirm removal from active queue
        setSelectedTicketId(null);
        showToast(
          `Ticket ${targetTicket?.ticketNumber || ""} resolved and moved to Archive.`,
          "View Archive",
          () => setWorkspaceTab("archive")
        );
      } else if (reopening) {
        setSelectedTicketId(null);
        showToast(
          `Ticket ${targetTicket?.ticketNumber || ""} reopened and returned to Active Queue.`,
          "View Active Queue",
          () => {
            setWorkspaceTab("active");
            setActiveSubFilter("all-open");
          }
        );
      }
    } catch (err) {
      console.error("Error updating ticket status:", err);
      loadDashboardData(false);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  const handleUpdatePriority = async (
    ticketId: string,
    nextPriority: ComplaintPriority
  ) => {
    try {
      setUpdatingTicketId(ticketId);

      setAllComplaints((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, priority: nextPriority } : t))
      );

      const res = await fetch(`/api/tech/complaints/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: nextPriority }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update priority");
      }

      if (data.complaint) {
        setAllComplaints((prev) =>
          prev.map((t) => (t.id === ticketId ? { ...t, ...data.complaint } : t))
        );
      }
    } catch (err) {
      console.error("Error updating ticket priority:", err);
      loadDashboardData(false);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  // Filtered list based on current workspace tab + sub-filter + search
  const displayedTickets = useMemo(() => {
    const baseList =
      workspaceTab === "archive"
        ? allComplaints.filter((c) => isTicketClosed(c.status))
        : allComplaints.filter((c) => !isTicketClosed(c.status));

    return baseList.filter((ticket) => {
      if (workspaceTab === "active") {
        if (activeSubFilter === "submitted") {
          if (ticket.status !== "submitted" && ticket.status !== "pending") return false;
        } else if (activeSubFilter === "triage") {
          if (ticket.status !== "under-review" && ticket.status !== "assigned") return false;
        } else if (activeSubFilter === "in-progress") {
          if (
            ticket.status !== "in-repair" &&
            ticket.status !== "in-progress" &&
            ticket.status !== "waiting-parts"
          ) {
            return false;
          }
        } else if (activeSubFilter === "urgent") {
          if (ticket.priority !== "critical" && ticket.priority !== "high") return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fields = [
          ticket.ticketNumber,
          ticket.title,
          ticket.description,
          ticket.userName,
          ticket.userEmail,
          ticket.userDepartment,
          ticket.itemSerial,
          ticket.itemName,
          ticket.deviceSummary,
          ticket.issueType,
          ticket.assignedTechName,
        ];
        if (!fields.some((f) => f && f.toLowerCase().includes(q))) {
          return false;
        }
      }

      return true;
    });
  }, [allComplaints, workspaceTab, activeSubFilter, searchQuery]);

  // Sub-filter counts for the Active Queue toolbar
  const subCounts = useMemo(() => {
    const open = allComplaints.filter((c) => !isTicketClosed(c.status));
    return {
      allOpen: open.length,
      submitted: open.filter((c) => c.status === "submitted" || c.status === "pending").length,
      triage: open.filter((c) => c.status === "under-review" || c.status === "assigned").length,
      inProgress: open.filter(
        (c) =>
          c.status === "in-repair" ||
          c.status === "in-progress" ||
          c.status === "waiting-parts"
      ).length,
      urgent: open.filter((c) => c.priority === "critical" || c.priority === "high").length,
    };
  }, [allComplaints]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ─── Top Page Header & Workspace Tabs (Aligned with /dashboard) ─── */}
      <div className="px-4 md:px-8 pt-4 sm:pt-6 pb-1 sm:pb-2">
        <div className="pb-3 sm:pb-5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              Service Desk
            </h1>
            {isRefreshing && (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-teal" />
                <span>Syncing</span>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Triage active staff requests, manage bench diagnostics, and monitor SLA resolutions.
          </p>
        </div>

        {/* Workspace Navigation Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 mt-2 sm:mt-4 border-b border-border/70 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => {
              setWorkspaceTab("active");
              setMobileLimit(6);
            }}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer shrink-0 ${
              workspaceTab === "active"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Inbox className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Active Queue</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                workspaceTab === "active"
                  ? "bg-brand-teal/15 text-brand-teal"
                  : "bg-surface-elevated text-muted"
              }`}
            >
              {metrics.openQueue}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setWorkspaceTab("archive");
              setMobileLimit(6);
            }}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer shrink-0 ${
              workspaceTab === "archive"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <Archive className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Resolved Archive</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                workspaceTab === "archive"
                  ? "bg-brand-teal/15 text-brand-teal"
                  : "bg-surface-elevated text-muted"
              }`}
            >
              {metrics.resolvedTickets}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setWorkspaceTab("audit")}
            className={`inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold border-b-2 -mb-px transition-colors cursor-pointer shrink-0 ${
              workspaceTab === "audit"
                ? "border-accent text-accent"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Activity Audit</span>
          </button>
        </div>
      </div>

      {/* ─── Workspace Body ─── */}
      <div className="px-4 md:px-8 pb-6 sm:pb-12 space-y-4 sm:space-y-6">
        {/* Status Toast Feedback */}
        {statusToast && (
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{statusToast.message}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {statusToast.actionLabel && statusToast.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    statusToast.onAction?.();
                    setStatusToast(null);
                  }}
                  className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
                >
                  {statusToast.actionLabel} →
                </button>
              )}
              <button
                type="button"
                onClick={() => setStatusToast(null)}
                className="text-muted hover:text-foreground cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Audit Feed */}
        {workspaceTab === "audit" ? (
          <LiveActivityTimeline />
        ) : (
          <>
            {/* Calm 4-Card KPI Strip (Matching DashboardView.tsx soft aesthetic) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Card 1: Open Queue */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceTab("active");
                  setActiveSubFilter("all-open");
                  setMobileLimit(6);
                }}
                className={`interactive-card text-left cursor-pointer rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] ${
                  workspaceTab === "active" && activeSubFilter === "all-open"
                    ? "border-brand-teal/40 bg-brand-teal/[0.04] dark:bg-brand-teal/10 ring-1 ring-brand-teal/20"
                    : "border-border/70 bg-surface/90 hover:border-brand-teal/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal dark:text-teal-400">
                    <Inbox className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      metrics.openQueue > 0
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                        : "bg-surface-elevated text-muted border border-border/50"
                    }`}
                  >
                    {metrics.openQueue > 0 ? "Needs Triage" : "Cleared"}
                  </span>
                </div>
                <div className="mt-2.5 sm:mt-4">
                  {initialLoading && allComplaints.length === 0 ? (
                    <div className="h-7 sm:h-9 w-12 sm:w-14 bg-surface-elevated animate-pulse rounded-lg" />
                  ) : (
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground/90 tabular-nums">
                      {metrics.openQueue}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-foreground/80 mt-0.5 sm:mt-1">
                    Open Queue
                  </p>
                  <p className="hidden sm:block text-[11px] text-muted mt-0.5">
                    Active requests awaiting completion
                  </p>
                </div>
              </button>

              {/* Card 2: Bench & Diagnostics */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceTab("active");
                  setActiveSubFilter("in-progress");
                  setMobileLimit(6);
                }}
                className={`interactive-card text-left cursor-pointer rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] ${
                  workspaceTab === "active" && activeSubFilter === "in-progress"
                    ? "border-blue-500/40 bg-blue-500/[0.04] dark:bg-blue-500/10 ring-1 ring-blue-500/20"
                    : "border-border/70 bg-surface/90 hover:border-blue-500/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${
                      metrics.inProgress > 0
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    <Wrench className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      metrics.inProgress > 0
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-300"
                        : "bg-surface-elevated text-muted border border-border/50"
                    }`}
                  >
                    {metrics.inProgress > 0 ? "Active" : "Idle"}
                  </span>
                </div>
                <div className="mt-2.5 sm:mt-4">
                  {initialLoading && allComplaints.length === 0 ? (
                    <div className="h-7 sm:h-9 w-12 sm:w-14 bg-surface-elevated animate-pulse rounded-lg" />
                  ) : (
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground/90 tabular-nums">
                      {metrics.inProgress}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-foreground/80 mt-0.5 sm:mt-1">
                    Bench & Repair
                  </p>
                  <p className="hidden sm:block text-[11px] text-muted mt-0.5">
                    Devices in diagnostic or repair
                  </p>
                </div>
              </button>

              {/* Card 3: Urgent SLA */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceTab("active");
                  setActiveSubFilter("urgent");
                  setMobileLimit(6);
                }}
                className={`interactive-card text-left cursor-pointer rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] ${
                  workspaceTab === "active" && activeSubFilter === "urgent"
                    ? "border-rose-500/40 bg-rose-500/[0.04] dark:bg-rose-500/10 ring-1 ring-rose-500/20"
                    : "border-border/70 bg-surface/90 hover:border-rose-500/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl ${
                      metrics.urgentTickets > 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-surface-elevated text-muted"
                    }`}
                  >
                    <ShieldAlert className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span
                    className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      metrics.urgentTickets > 0
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        : "bg-surface-elevated text-muted border border-border/50"
                    }`}
                  >
                    {metrics.urgentTickets > 0 ? "Urgent" : "Nominal"}
                  </span>
                </div>
                <div className="mt-2.5 sm:mt-4">
                  {initialLoading && allComplaints.length === 0 ? (
                    <div className="h-7 sm:h-9 w-12 sm:w-14 bg-surface-elevated animate-pulse rounded-lg" />
                  ) : (
                    <p
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                        metrics.urgentTickets > 0
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-foreground/90"
                      }`}
                    >
                      {metrics.urgentTickets}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-foreground/80 mt-0.5 sm:mt-1">
                    Urgent Priority
                  </p>
                  <p className="hidden sm:block text-[11px] text-muted mt-0.5">
                    Critical & high severity tickets
                  </p>
                </div>
              </button>

              {/* Card 4: Resolved Archive */}
              <button
                type="button"
                onClick={() => {
                  setWorkspaceTab("archive");
                  setMobileLimit(6);
                }}
                className={`interactive-card text-left cursor-pointer rounded-2xl border p-3.5 sm:p-5 transition-all duration-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_-4px_rgba(0,0,0,0.06)] ${
                  workspaceTab === "archive"
                    ? "border-emerald-500/40 bg-emerald-500/[0.04] dark:bg-emerald-500/10 ring-1 ring-emerald-500/20"
                    : "border-border/70 bg-surface/90 hover:border-emerald-500/30"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5" />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-elevated text-muted border border-border/50">
                    Archived
                  </span>
                </div>
                <div className="mt-2.5 sm:mt-4">
                  {initialLoading && allComplaints.length === 0 ? (
                    <div className="h-7 sm:h-9 w-12 sm:w-14 bg-surface-elevated animate-pulse rounded-lg" />
                  ) : (
                    <p className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground/90 tabular-nums">
                      {metrics.resolvedTickets}
                    </p>
                  )}
                  <p className="text-xs font-semibold text-foreground/80 mt-0.5 sm:mt-1">
                    Resolved Archive
                  </p>
                  <p className="hidden sm:block text-[11px] text-muted mt-0.5">
                    Completed & returned to staff
                  </p>
                </div>
              </button>
            </div>

            {/* Subtle Critical Alert Strip (only shown on Active Queue when unresolved critical issues exist) */}
            {workspaceTab === "active" && criticalOpenTickets.length > 0 && (
              <div className="rounded-2xl border border-rose-500/25 bg-rose-500/[0.05] px-3.5 sm:px-5 py-2.5 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <p className="text-xs font-medium text-foreground">
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {criticalOpenTickets.length} critical{" "}
                      {criticalOpenTickets.length === 1 ? "ticket" : "tickets"}
                    </span>{" "}
                    in queue awaiting immediate attention.
                  </p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {criticalOpenTickets.slice(0, 3).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTicketId(t.id)}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/25 bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:border-rose-500 transition-colors cursor-pointer"
                    >
                      <span className="font-mono font-semibold text-rose-600 dark:text-rose-400">
                        {t.ticketNumber}
                      </span>
                      <span className="truncate max-w-[140px] sm:max-w-[160px]">{t.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ─── Main Scannable Ticket Table Container ─── */}
            <div className="rounded-2xl border border-border/70 bg-surface/90 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Table Header & Controls */}
              <div className="px-3.5 sm:px-5 py-3 sm:py-4 border-b border-border/60 bg-surface/60 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3.5">
                <div>
                  <h2 className="text-sm font-bold text-foreground">
                    {workspaceTab === "archive"
                      ? "Resolved & Closed History"
                      : "Active Service Queue"}
                  </h2>
                  <p className="hidden sm:block text-xs text-muted mt-0.5">
                    {workspaceTab === "archive"
                      ? "Historical record of serviced hardware and resolved requests. Click any ticket to review notes or reopen."
                      : "Click any request to inspect full details, attach technical notes, assign a specialist, or mark resolved."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setMobileLimit(6);
                      }}
                      placeholder="Filter by ID, staff, or device..."
                      className="w-full sm:w-56 pl-8 pr-7 py-1.5 rounded-xl border border-border/70 bg-surface text-xs text-foreground placeholder:text-muted focus:border-brand-teal focus:outline-hidden focus:ring-1 focus:ring-brand-teal/40"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setMobileLimit(6);
                        }}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs cursor-pointer"
                        title="Clear search"
                      >
                        ×
                      </button>
                    )}
                  </div>

                  {/* Active Queue Sub-Filters */}
                  {workspaceTab === "active" && (
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface-elevated/70 border border-border/60 text-xs overflow-x-auto no-scrollbar">
                      {[
                        { id: "all-open", label: "All Open", count: subCounts.allOpen },
                        { id: "submitted", label: "New", count: subCounts.submitted },
                        { id: "triage", label: "Triage", count: subCounts.triage },
                        { id: "in-progress", label: "In Repair", count: subCounts.inProgress },
                        { id: "urgent", label: "Urgent", count: subCounts.urgent },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => {
                            setActiveSubFilter(tab.id as ActiveSubFilter);
                            setMobileLimit(6);
                          }}
                          className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                            activeSubFilter === tab.id
                              ? "bg-surface text-foreground font-semibold shadow-2xs border border-border/60"
                              : "text-muted hover:text-foreground"
                          }`}
                        >
                          {tab.label} ({tab.count})
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Ticket Rows */}
              {initialLoading && allComplaints.length === 0 ? (
                <div className="p-6 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-surface-elevated/70 animate-pulse rounded-xl"
                    />
                  ))}
                </div>
              ) : displayedTickets.length === 0 ? (
                <div className="py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-brand-teal/10 border border-brand-teal/20 flex items-center justify-center text-brand-teal mx-auto mb-3.5">
                    {workspaceTab === "archive" ? (
                      <Archive className="w-5 h-5" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5" />
                    )}
                  </div>

                  {searchQuery.trim() ||
                  (workspaceTab === "active" && activeSubFilter !== "all-open") ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        No matching tickets found
                      </p>
                      <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                        Adjust your search terms or switch back to view all open tickets.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setActiveSubFilter("all-open");
                        }}
                        className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border/70 bg-surface hover:bg-surface-elevated text-xs font-medium text-foreground transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-brand-teal" />
                        Clear filters
                      </button>
                    </>
                  ) : workspaceTab === "active" ? (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        All caught up — active queue is clear
                      </p>
                      <p className="text-xs text-muted mt-1 max-w-md mx-auto">
                        Every reported issue has been resolved and moved out of the live queue. New staff tickets will appear here automatically.
                      </p>
                      {metrics.resolvedTickets > 0 && (
                        <button
                          type="button"
                          onClick={() => setWorkspaceTab("archive")}
                          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/70 bg-surface hover:bg-surface-elevated text-xs font-medium text-foreground transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5 text-brand-teal" />
                          <span>
                            View {metrics.resolvedTickets} resolved{" "}
                            {metrics.resolvedTickets === 1 ? "ticket" : "tickets"} in archive
                          </span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground">
                        No resolved tickets yet
                      </p>
                      <p className="text-xs text-muted mt-1">
                        Completed service requests will be archived here for historical lookup.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <>
                  <div className="divide-y divide-border/60">
                    {displayedTickets.map((ticket, idx) => {
                      const stageMeta = getStageMeta(ticket.status);
                      const PriorityIcon =
                        ticket.priority === "critical"
                          ? PriorityCriticalIcon
                          : ticket.priority === "high"
                          ? PriorityHighIcon
                          : ticket.priority === "medium"
                          ? PriorityMediumIcon
                          : PriorityLowIcon;

                      const deviceLabel = ticket.itemName || ticket.deviceSummary;

                      return (
                        <div
                          key={ticket.id}
                          onClick={() => setSelectedTicketId(ticket.id)}
                          className={`${
                            idx >= mobileLimit ? "hidden md:flex" : "flex"
                          } group px-3.5 sm:px-5 py-3 sm:py-4 hover:bg-surface-elevated/45 transition-colors cursor-pointer flex-col md:flex-row md:items-center justify-between gap-2 md:gap-3.5`}
                        >
                          {/* Left: Priority, Ticket ID, Title & Metadata */}
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div
                              className="hidden md:flex mt-0.5 p-2 rounded-xl bg-surface-elevated/70 border border-border/60 shrink-0"
                              title={`Priority: ${ticket.priority}`}
                            >
                              <PriorityIcon className="w-4 h-4" />
                            </div>

                            <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 min-w-0 truncate">
                                  <span className="md:hidden shrink-0 inline-flex">
                                    <PriorityIcon className="w-3.5 h-3.5" />
                                  </span>
                                  <span className="font-mono text-xs font-semibold text-muted shrink-0">
                                    {ticket.ticketNumber}
                                  </span>
                                  {ticket.issueType && (
                                    <span className="text-xs text-muted/80 truncate">
                                      · {ticket.issueType}
                                    </span>
                                  )}
                                </div>
                                <span
                                  className={`md:hidden inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border shrink-0 ${stageMeta.pillClass}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dotClass}`} />
                                  <span>{stageMeta.label}</span>
                                </span>
                              </div>

                              <h3 className="text-sm font-semibold text-foreground group-hover:text-brand-teal transition-colors truncate max-w-2xl">
                                {ticket.title}
                              </h3>

                              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs text-muted">
                                <span>
                                  <strong className="font-medium text-foreground/80">
                                    {ticket.userName}
                                  </strong>
                                  <span className="hidden sm:inline">
                                    {ticket.userDepartment ? ` (${ticket.userDepartment})` : ""}
                                  </span>
                                </span>

                                {deviceLabel && (
                                  <>
                                    <span className="text-border">•</span>
                                    <span className="inline-flex items-center gap-1 text-foreground/75">
                                      <Laptop className="w-3 h-3 text-muted shrink-0" />
                                      <span className="truncate max-w-[140px] sm:max-w-[180px]">
                                        {deviceLabel}
                                      </span>
                                    </span>
                                  </>
                                )}

                                <span className="md:hidden text-border">•</span>
                                <span className="md:hidden text-xs text-muted">
                                  {ticket.assignedTechName || "Unassigned"}
                                </span>

                                <span className="md:hidden text-border">•</span>
                                <span
                                  title={
                                    [
                                      ticket.createdAt
                                        ? `Created: ${formatDateTime(ticket.createdAt)}`
                                        : null,
                                      ticket.resolvedAt
                                        ? `Resolved: ${formatDateTime(ticket.resolvedAt)}`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ") || undefined
                                  }
                                  className="md:hidden text-xs text-muted tabular-nums"
                                >
                                  {workspaceTab === "archive" && ticket.resolvedAt
                                    ? `Resolved ${formatRelativeTime(ticket.resolvedAt)}`
                                    : formatRelativeTime(ticket.createdAt)}
                                </span>

                                {workspaceTab === "archive" &&
                                  (ticket.resolutionSummary || ticket.techNotes) && (
                                    <>
                                      <span className="hidden sm:inline text-border">•</span>
                                      <span className="hidden sm:inline text-emerald-700 dark:text-emerald-400/90 truncate max-w-xs">
                                        Fix: {ticket.resolutionSummary || ticket.techNotes}
                                      </span>
                                    </>
                                  )}
                              </div>
                            </div>
                          </div>

                          {/* Right (Desktop): Stage Pill, Assignee, Relative Time & Inspect Arrow */}
                          <div className="hidden md:flex items-center justify-end gap-5 shrink-0">
                            {/* Assignee */}
                            <div className="flex items-center gap-2 min-w-[115px] justify-end">
                              {ticket.assignedTechName ? (
                                <div className="inline-flex items-center gap-1.5">
                                  <span className="w-5 h-5 rounded-full bg-brand-teal/15 text-brand-teal text-[10px] font-bold flex items-center justify-center border border-brand-teal/25">
                                    {getInitials(ticket.assignedTechName)}
                                  </span>
                                  <span className="text-xs font-medium text-foreground/85 truncate max-w-[110px]">
                                    {ticket.assignedTechName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-muted">Unassigned</span>
                              )}
                            </div>

                            {/* Single Calm Stage Pill */}
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${stageMeta.pillClass}`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${stageMeta.dotClass}`} />
                              <span>{stageMeta.label}</span>
                            </span>

                            {/* Timestamp + Open Indicator */}
                            <div
                              title={
                                [
                                  ticket.createdAt
                                    ? `Created: ${formatDateTime(ticket.createdAt)}`
                                    : null,
                                  ticket.resolvedAt
                                    ? `Resolved: ${formatDateTime(ticket.resolvedAt)}`
                                    : null,
                                ]
                                  .filter(Boolean)
                                  .join(" • ") || undefined
                              }
                              className="flex items-center gap-2 text-xs text-muted min-w-[70px] justify-end whitespace-nowrap"
                            >
                              <span>
                                {workspaceTab === "archive" && ticket.resolvedAt
                                  ? `Resolved ${formatRelativeTime(ticket.resolvedAt)}`
                                  : formatRelativeTime(ticket.createdAt)}
                              </span>
                              <ChevronRight className="w-4 h-4 text-muted/60 group-hover:text-brand-teal group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="md:hidden">
                    <ShowMoreBar
                      visibleCount={Math.min(mobileLimit, displayedTickets.length)}
                      totalCount={displayedTickets.length}
                      initialLimit={6}
                      noun="tickets"
                      onShowMore={() => setMobileLimit((prev) => prev + 6)}
                      onCollapse={() => setMobileLimit(6)}
                    />
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Slide-Over Ticket Inspector Drawer ─── */}
      <TicketInspectorDrawer
        ticket={selectedTicket}
        admin={admin}
        updating={Boolean(selectedTicket && updatingTicketId === selectedTicket.id)}
        onClose={() => setSelectedTicketId(null)}
        onUpdateStatus={handleUpdateStatus}
        onUpdatePriority={handleUpdatePriority}
        onOpenAssign={(t) => setAssigningTicket(t)}
      />

      {/* ─── Specialist Assignment Modal ─── */}
      <AssignTicketModal
        isOpen={Boolean(assigningTicket)}
        ticket={assigningTicket}
        currentUserId={admin.id}
        onClose={() => setAssigningTicket(null)}
        onAssigned={(updatedTicket) => {
          setAllComplaints((prev) =>
            prev.map((t) =>
              t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t
            )
          );
          showToast(
            `Ticket ${updatedTicket.ticketNumber} assigned to ${
              updatedTicket.assignedTechName || "specialist"
            }.`
          );
        }}
      />
    </div>
  );
}
