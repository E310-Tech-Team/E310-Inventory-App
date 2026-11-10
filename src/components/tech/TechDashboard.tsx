"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Layers,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Check,
  Loader2,
  Wrench,
  Search,
  LayoutDashboard,
  ExternalLink,
  RotateCcw,
} from "lucide-react";
import {
  PriorityCriticalIcon,
  PriorityHighIcon,
  PriorityMediumIcon,
  PriorityLowIcon,
} from "@/components/common/Icons";
import { Admin, DeviceComplaint } from "@/types";
import { LiveActivityTimeline } from "./LiveActivityTimeline";
import { AssignTicketModal } from "./AssignTicketModal";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { broadcastTicketUpdate, subscribeToTicketUpdates } from "@/lib/sync/ticket-broadcast";

const PROGRESS_STAGES = [
  {
    id: "submitted",
    step: 1,
    label: "Submitted",
    sublabel: "Logged in queue",
    activeClass:
      "bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/40 ring-2 ring-amber-500/30 font-bold shadow-xs",
  },
  {
    id: "under-review",
    step: 2,
    label: "Triage & Review",
    sublabel: "Assigned to tech",
    activeClass:
      "bg-purple-500/15 text-purple-800 dark:text-purple-300 border-purple-500/40 ring-2 ring-purple-500/30 font-bold shadow-xs",
  },
  {
    id: "in-repair",
    step: 3,
    label: "In Diagnostic / Repair",
    sublabel: "Bench work active",
    activeClass:
      "bg-blue-500/15 text-blue-800 dark:text-blue-300 border-blue-500/40 ring-2 ring-blue-500/30 font-bold shadow-xs",
  },
  {
    id: "resolved",
    step: 4,
    label: "Resolved",
    sublabel: "Ready & returned",
    activeClass:
      "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/40 ring-2 ring-emerald-500/30 font-bold shadow-xs",
  },
];

function getStageIndex(status?: string): number {
  if (!status) return 1;
  switch (status.toLowerCase()) {
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

interface TicketMetrics {
  totalTickets: number;
  openQueue: number;
  inProgress: number;
  urgentTickets: number;
  resolvedTickets: number;
}

export function TechDashboard({ admin }: { admin: Admin }) {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [allComplaints, setAllComplaints] = useState<DeviceComplaint[]>([]);
  const [criticalComplaints, setCriticalComplaints] = useState<DeviceComplaint[]>([]);
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in-progress" | "urgent" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [assigningTicket, setAssigningTicket] = useState<DeviceComplaint | null>(null);
  const [assignmentSuccessMsg, setAssignmentSuccessMsg] = useState<string | null>(null);
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [resolvingTicket, setResolvingTicket] = useState<DeviceComplaint | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [resolvingSaving, setResolvingSaving] = useState(false);

  // Compute live ticket metrics dynamically from state
  const metrics: TicketMetrics = useMemo(() => {
    const openTickets = allComplaints.filter(
      (c) => c.status !== "resolved" && c.status !== "closed"
    );
    const inProgressTickets = allComplaints.filter(
      (c) => c.status === "in-repair" || c.status === "in-progress" || c.status === "waiting-parts"
    );
    const urgentTickets = allComplaints.filter(
      (c) => (c.priority === "critical" || c.priority === "high") && c.status !== "resolved" && c.status !== "closed"
    );
    const resolvedTickets = allComplaints.filter(
      (c) => c.status === "resolved" || c.status === "closed"
    );

    return {
      totalTickets: allComplaints.length,
      openQueue: openTickets.length,
      inProgress: inProgressTickets.length,
      urgentTickets: urgentTickets.length,
      resolvedTickets: resolvedTickets.length,
    };
  }, [allComplaints]);

  // Load dashboard data: isInitial sets skeleton; background refreshes are completely silent
  const loadDashboardData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        setInitialLoading(true);
      } else {
        setIsRefreshing(true);
      }

      const complaintsRes = await fetch("/api/tech/complaints").catch(() => null);
      const complaintsData = complaintsRes && complaintsRes.ok ? await complaintsRes.json() : { complaints: [] };
      const rawComplaints: any[] = complaintsData.complaints ?? [];

      const complaints: DeviceComplaint[] = rawComplaints.map((c) => ({
        id: c.id,
        ticketNumber: c.ticket_number || c.ticketNumber,
        userId: c.user_id || c.userId,
        userName: c.user_name || c.userName || "Staff Member",
        userEmail: c.user_email || c.userEmail || "",
        userDepartment: c.user_department || c.userDepartment,
        itemId: c.item_id || c.itemId,
        itemName: c.item?.name || c.itemName,
        itemSerial: c.item?.serial_number || c.itemSerial,
        title: c.title,
        description: c.description,
        issueType: c.issue_type || c.issueType,
        priority: c.priority || "medium",
        status: c.status || "submitted",
        attachmentUrls: c.attachment_urls || c.attachmentUrls || [],
        assignedTechId: c.assigned_tech_id || c.assignedTechId,
        assignedTechName: c.assigned_tech?.name || c.assignedTechName || null,
        techNotes: c.tech_notes || c.techNotes,
        resolutionSummary: c.resolution_summary || c.resolutionSummary,
        resolvedAt: c.resolved_at || c.resolvedAt,
        createdAt: c.created_at || c.createdAt,
        updatedAt: c.updated_at || c.updatedAt,
      }));

      const critical = complaints.filter(
        (c) => c.priority === "critical" && c.status !== "resolved" && c.status !== "closed"
      );

      setCriticalComplaints(critical);
      setAllComplaints(complaints);
    } catch (err) {
      console.error("Failed to load tech service metrics:", err);
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Initial fetch shows skeleton only once
    loadDashboardData(true);

    // Silent event-driven updates across tabs (no pulsing skeletons)
    const unsubscribe = subscribeToTicketUpdates(() => {
      loadDashboardData(false);
    });

    return () => unsubscribe();
  }, [loadDashboardData]);

  const handleUpdateStatus = async (ticketId: string, nextStatus: string, notes?: string) => {
    try {
      setUpdatingTicketId(ticketId);

      // Instant optimistic UI update
      setAllComplaints((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
                ...t,
                status: nextStatus as any,
                techNotes: notes || t.techNotes,
                resolutionSummary: notes || t.resolutionSummary,
              }
            : t
        )
      );

      // Real-time broadcast so Staff Portal updates immediately
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
    } catch (err: any) {
      console.error("Error updating ticket progression:", err);
      loadDashboardData(false);
    } finally {
      setUpdatingTicketId(null);
      setResolvingTicket(null);
      setResolutionNotes("");
      setResolvingSaving(false);
    }
  };

  // Filter complaints based on active card/tab and search query
  const displayedComplaints = useMemo(() => {
    return allComplaints.filter((ticket) => {
      // 1. Status Filter
      if (ticketFilter === "open") {
        if (ticket.status === "resolved" || ticket.status === "closed") return false;
      } else if (ticketFilter === "in-progress") {
        if (
          ticket.status !== "in-repair" &&
          ticket.status !== "in-progress" &&
          ticket.status !== "waiting-parts"
        ) {
          return false;
        }
      } else if (ticketFilter === "urgent") {
        if (ticket.priority !== "critical" && ticket.priority !== "high") return false;
        if (ticket.status === "resolved" || ticket.status === "closed") return false;
      } else if (ticketFilter === "resolved") {
        if (ticket.status !== "resolved" && ticket.status !== "closed") return false;
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNumber = ticket.ticketNumber?.toLowerCase().includes(q);
        const matchTitle = ticket.title?.toLowerCase().includes(q);
        const matchUser = ticket.userName?.toLowerCase().includes(q);
        const matchEmail = ticket.userEmail?.toLowerCase().includes(q);
        const matchSerial = ticket.itemSerial?.toLowerCase().includes(q);
        const matchDevice = ticket.itemName?.toLowerCase().includes(q);
        const matchType = ticket.issueType?.toLowerCase().includes(q);

        if (!matchNumber && !matchTitle && !matchUser && !matchEmail && !matchSerial && !matchDevice && !matchType) {
          return false;
        }
      }

      return true;
    });
  }, [allComplaints, ticketFilter, searchQuery]);

  return (
    <div className="min-h-screen bg-background px-4 sm:px-6 lg:px-8 py-8 text-foreground">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Header / Greeting */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Service Desk & Diagnostics
              </h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-brand-teal/15 text-brand-teal border border-brand-teal/25">
                Tech Operations
              </span>
              {isRefreshing && (
                <span className="inline-flex items-center gap-1 text-[11px] text-muted font-medium ml-2">
                  <Loader2 className="w-3 h-3 animate-spin text-brand-teal" />
                  <span>Updating...</span>
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-muted">
              Triage staff support requests, advance bench repair stages, and assign specialists.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-medium text-foreground transition-colors shadow-xs"
            >
              <LayoutDashboard className="w-4 h-4 text-brand-teal" />
              Inventory Dashboard
            </Link>
            <Link
              href="/tech/approvals"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-medium text-foreground transition-colors shadow-xs"
            >
              <UserCheck className="w-4 h-4 text-brand-teal" />
              Approvals Queue
            </Link>
            <Link
              href="/staff/tickets"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs sm:text-sm font-medium text-foreground transition-colors shadow-xs"
            >
              <ExternalLink className="w-4 h-4 text-muted" />
              Staff View
            </Link>
          </div>
        </div>

        {/* Critical Complaints Alert Banner */}
        {criticalComplaints.length > 0 && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-rose-600 dark:text-rose-300">
                    High Priority: {criticalComplaints.length} Critical Hardware {criticalComplaints.length === 1 ? "Ticket" : "Tickets"}
                  </h3>
                  <span className="inline-flex items-center rounded-full bg-rose-500/20 px-2.5 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-500/30">
                    Action Required
                  </span>
                </div>
                <p className="mt-1 text-xs sm:text-sm text-foreground-muted">
                  Critical hardware complaints require immediate IT triage or equipment replacement.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {criticalComplaints.map((ticket) => (
                    <button
                      key={ticket.id}
                      type="button"
                      onClick={() => {
                        setSearchQuery(ticket.ticketNumber);
                        setTicketFilter("all");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 bg-surface px-3 py-1.5 text-xs font-medium text-foreground shadow-xs hover:border-rose-500 transition-colors cursor-pointer"
                      title="Filter queue to this critical ticket"
                    >
                      <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{ticket.ticketNumber}</span>
                      <span>{ticket.title}</span>
                      <span className="text-muted">•</span>
                      <span className="text-muted">{ticket.userName}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Operations Metric KPI Cards (Click to Filter) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Card 1: Open Service Queue */}
          <button
            type="button"
            onClick={() => setTicketFilter(ticketFilter === "open" ? "all" : "open")}
            className={`group relative text-left rounded-2xl border bg-surface p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
              ticketFilter === "open"
                ? "border-amber-500/60 ring-2 ring-amber-500/20 bg-amber-500/[0.04]"
                : "border-border hover:border-amber-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Open Service Queue
              </span>
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  metrics.openQueue > 0
                    ? "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                    : "bg-surface-elevated text-muted"
                }`}
              >
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {initialLoading && allComplaints.length === 0 ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {metrics.openQueue}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Awaiting triage or repair</span>
                <span
                  className={`inline-flex items-center font-semibold transition-colors ${
                    ticketFilter === "open"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-muted group-hover:text-amber-600 dark:group-hover:text-amber-400"
                  }`}
                >
                  {ticketFilter === "open" ? "Filter active" : "Filter queue"} →
                </span>
              </div>
            </div>
          </button>

          {/* Card 2: Active Bench Work */}
          <button
            type="button"
            onClick={() => setTicketFilter(ticketFilter === "in-progress" ? "all" : "in-progress")}
            className={`group relative text-left rounded-2xl border bg-surface p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
              ticketFilter === "in-progress"
                ? "border-blue-500/60 ring-2 ring-blue-500/20 bg-blue-500/[0.04]"
                : "border-border hover:border-blue-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Active Bench Work
              </span>
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  metrics.inProgress > 0
                    ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                    : "bg-surface-elevated text-muted"
                }`}
              >
                <Wrench className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {initialLoading && allComplaints.length === 0 ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {metrics.inProgress}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Diagnostics & repairs</span>
                <span
                  className={`inline-flex items-center font-semibold transition-colors ${
                    ticketFilter === "in-progress"
                      ? "text-blue-600 dark:text-blue-400"
                      : "text-muted group-hover:text-blue-600 dark:group-hover:text-blue-400"
                  }`}
                >
                  {ticketFilter === "in-progress" ? "Filter active" : "Filter bench"} →
                </span>
              </div>
            </div>
          </button>

          {/* Card 3: Urgent Priority */}
          <button
            type="button"
            onClick={() => setTicketFilter(ticketFilter === "urgent" ? "all" : "urgent")}
            className={`group relative text-left rounded-2xl border bg-surface p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
              ticketFilter === "urgent"
                ? "border-rose-500/60 ring-2 ring-rose-500/20 bg-rose-500/[0.04]"
                : "border-border hover:border-rose-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Urgent Priority
              </span>
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  metrics.urgentTickets > 0
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "bg-surface-elevated text-muted"
                }`}
              >
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {initialLoading && allComplaints.length === 0 ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div
                  className={`text-3xl font-black tracking-tight ${
                    metrics.urgentTickets > 0 ? "text-rose-600 dark:text-rose-400" : "text-foreground"
                  }`}
                >
                  {metrics.urgentTickets}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Critical & high severity</span>
                <span
                  className={`inline-flex items-center font-semibold transition-colors ${
                    ticketFilter === "urgent"
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-muted group-hover:text-rose-600 dark:group-hover:text-rose-400"
                  }`}
                >
                  {ticketFilter === "urgent" ? "Filter active" : "Filter urgent"} →
                </span>
              </div>
            </div>
          </button>

          {/* Card 4: Resolved & Returned */}
          <button
            type="button"
            onClick={() => setTicketFilter(ticketFilter === "resolved" ? "all" : "resolved")}
            className={`group relative text-left rounded-2xl border bg-surface p-5 shadow-xs transition-all hover:shadow-md cursor-pointer ${
              ticketFilter === "resolved"
                ? "border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-500/[0.04]"
                : "border-border hover:border-emerald-500/40"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                Resolved & Returned
              </span>
              <div
                className={`p-2.5 rounded-xl transition-colors ${
                  metrics.resolvedTickets > 0
                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : "bg-surface-elevated text-muted"
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              {initialLoading && allComplaints.length === 0 ? (
                <div className="h-8 w-16 bg-surface-elevated animate-pulse rounded" />
              ) : (
                <div className="text-3xl font-black text-foreground tracking-tight">
                  {metrics.resolvedTickets}
                </div>
              )}
              <div className="mt-1 flex items-center justify-between text-xs text-muted">
                <span>Serviced & closed out</span>
                <span
                  className={`inline-flex items-center font-semibold transition-colors ${
                    ticketFilter === "resolved"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-muted group-hover:text-emerald-600 dark:group-hover:text-emerald-400"
                  }`}
                >
                  {ticketFilter === "resolved" ? "Filter active" : "Filter closed"} →
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Assignment Success Alert */}
        {assignmentSuccessMsg && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{assignmentSuccessMsg}</span>
            </div>
            <button
              onClick={() => setAssignmentSuccessMsg(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:underline text-xs font-bold"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Live Support & Complaint Triage Queue */}
        <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-surface-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-foreground">Hardware & Software Tickets</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-surface border border-border text-foreground">
                  {displayedComplaints.length} of {allComplaints.length}
                </span>
              </div>
              <p className="text-xs text-muted">Live dispatch queue for troubleshooting and repairs</p>
            </div>

            {/* Search and Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search ticket, name, serial..."
                  className="w-full sm:w-56 pl-8 pr-7 py-1.5 rounded-xl border border-border bg-surface text-xs text-foreground placeholder:text-muted focus:border-brand-teal focus:outline-hidden focus:ring-1 focus:ring-brand-teal"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs leading-none"
                    title="Clear search"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Segmented Filter Buttons */}
              <div className="flex items-center gap-1 p-0.5 rounded-xl bg-surface border border-border text-xs overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setTicketFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    ticketFilter === "all"
                      ? "bg-surface-elevated text-foreground font-semibold shadow-xs border border-border/60"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  All ({metrics.totalTickets})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter("open")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    ticketFilter === "open"
                      ? "bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold border border-amber-500/30 shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Open ({metrics.openQueue})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter("in-progress")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    ticketFilter === "in-progress"
                      ? "bg-blue-500/15 text-blue-800 dark:text-blue-300 font-bold border border-blue-500/30 shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Bench ({metrics.inProgress})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter("urgent")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    ticketFilter === "urgent"
                      ? "bg-rose-500/15 text-rose-800 dark:text-rose-300 font-bold border border-rose-500/30 shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Urgent ({metrics.urgentTickets})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketFilter("resolved")}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                    ticketFilter === "resolved"
                      ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-500/30 shadow-xs"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Resolved ({metrics.resolvedTickets})
                </button>
              </div>
            </div>
          </div>

          {initialLoading && allComplaints.length === 0 ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-surface-elevated animate-pulse rounded-xl" />
              ))}
            </div>
          ) : displayedComplaints.length === 0 ? (
            <div className="py-12 text-center">
              {allComplaints.length === 0 ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-brand-teal mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No active support tickets</p>
                  <p className="text-xs text-muted mt-1">All staff devices are operating normally.</p>
                </>
              ) : (
                <>
                  <AlertCircle className="w-10 h-10 text-muted mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">No tickets match current filters</p>
                  <p className="text-xs text-muted mt-1">Try clearing your search query or switching filters.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTicketFilter("all");
                      setSearchQuery("");
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground transition-colors shadow-xs cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-brand-teal" />
                    Reset all filters
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {displayedComplaints.map((ticket) => {
                const priorityBadge =
                  ticket.priority === "critical"
                    ? "bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30"
                    : ticket.priority === "high"
                    ? "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30"
                    : "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30";

                const PriorityIcon =
                  ticket.priority === "critical"
                    ? PriorityCriticalIcon
                    : ticket.priority === "high"
                    ? PriorityHighIcon
                    : ticket.priority === "medium"
                    ? PriorityMediumIcon
                    : PriorityLowIcon;

                const statusBadge =
                  ticket.status === "resolved" || ticket.status === "closed"
                    ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                    : ticket.status === "in-repair" || ticket.status === "in-progress"
                    ? "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30"
                    : ticket.status === "under-review" || ticket.status === "assigned"
                    ? "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30"
                    : "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30";

                return (
                  <div
                    key={ticket.id}
                    className="p-4 sm:p-5 hover:bg-surface-elevated/40 transition-colors space-y-3.5"
                  >
                    {/* Top Row: Ticket Info & Specialist */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-surface-elevated border border-border text-muted mt-0.5 shrink-0">
                          <Wrench className="w-4 h-4 text-brand-teal" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-foreground">
                              {ticket.ticketNumber}
                            </span>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                              <PriorityIcon className="w-3 h-3" />
                              <span>{ticket.priority.toUpperCase()}</span>
                            </span>
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                              {ticket.status.replace("-", " ")}
                            </span>
                            {ticket.issueType && (
                              <span className="text-xs text-muted">
                                • {ticket.issueType}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-semibold text-foreground">{ticket.title}</h4>
                          <p className="text-xs text-muted">
                            Submitted by <span className="font-medium text-foreground">{ticket.userName}</span>
                            {ticket.userDepartment ? ` (${ticket.userDepartment})` : ""} •{" "}
                            {(() => {
                              const dVal = ticket.createdAt || (ticket as any).created_at;
                              if (!dVal) return "Recently";
                              const d = new Date(dVal);
                              return isNaN(d.getTime()) ? "Recently" : d.toLocaleDateString();
                            })()}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
                        <span className="text-xs text-muted font-mono hidden sm:inline">
                          {ticket.itemSerial ? `SN: ${ticket.itemSerial}` : ""}
                        </span>

                        {/* Assigned Specialist Badge */}
                        {ticket.assignedTechName ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Specialist: <strong>{ticket.assignedTechName}</strong></span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            Unassigned
                          </span>
                        )}

                        {/* Delegate / Reassign Button for Super Admins */}
                        {admin.role === "super-admin" && (
                          <button
                            type="button"
                            onClick={() => setAssigningTicket(ticket)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-surface hover:bg-surface-elevated text-xs font-semibold text-foreground transition-colors shadow-xs cursor-pointer"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-brand-teal" />
                            <span>{ticket.assignedTechId ? "Reassign" : "Assign Specialist"}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Interactive 4-Stage Progression Bar for Tech Team */}
                    <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-muted uppercase tracking-wider mr-1">
                          Progress Status:
                        </span>
                        {PROGRESS_STAGES.map((stage) => {
                          const currentIdx = getStageIndex(ticket.status);
                          const isCurrent = currentIdx === stage.step;
                          const isPast = currentIdx > stage.step;
                          const isUpdating = updatingTicketId === ticket.id;

                          return (
                            <button
                              key={stage.id}
                              type="button"
                              disabled={isUpdating}
                              onClick={() => {
                                if (stage.id === "resolved") {
                                  setResolvingTicket(ticket);
                                  setResolutionNotes(ticket.techNotes || ticket.resolutionSummary || "");
                                } else {
                                  handleUpdateStatus(ticket.id, stage.id);
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                isCurrent
                                  ? stage.activeClass
                                  : isPast
                                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/20"
                                  : "bg-surface-elevated/70 text-muted hover:text-foreground hover:bg-surface-elevated border-border"
                              }`}
                              title={`Advance or set ticket to ${stage.label}`}
                            >
                              {isUpdating && isCurrent ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-current" />
                              ) : isPast ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : isCurrent ? (
                                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                              ) : null}
                              <span>{stage.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Resolution note preview if notes exist */}
                      {(ticket.techNotes || ticket.resolutionSummary) && (
                        <span className="text-[11px] text-muted truncate max-w-xs font-mono">
                          Notes: {ticket.techNotes || ticket.resolutionSummary}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Real-Time Live Activity Feed */}
        <LiveActivityTimeline />

        {/* Ticket Assignment Modal */}
        <AssignTicketModal
          isOpen={Boolean(assigningTicket)}
          ticket={assigningTicket}
          currentUserId={admin.id}
          onClose={() => setAssigningTicket(null)}
          onAssigned={(updatedTicket) => {
            setAllComplaints((prev) =>
              prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
            );
            setCriticalComplaints((prev) =>
              prev.map((t) => (t.id === updatedTicket.id ? { ...t, ...updatedTicket } : t))
            );
            setAssignmentSuccessMsg(
              `Ticket ${updatedTicket.ticketNumber} successfully delegated to ${updatedTicket.assignedTechName || "specialist"}.`
            );
            setTimeout(() => setAssignmentSuccessMsg(null), 5000);
          }}
        />

        {/* Technical Resolution Summary Modal */}
        {resolvingTicket && (
          <Modal
            isOpen={Boolean(resolvingTicket)}
            onClose={() => {
              if (!resolvingSaving) setResolvingTicket(null);
            }}
            title={`Resolve Ticket — ${resolvingTicket.ticketNumber}`}
            description="Provide technical resolution notes and conclude this support request."
            size="md"
          >
            <div className="space-y-4 text-xs">
              <div className="p-3 bg-surface-elevated rounded-xl border border-border space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted">Issue Title:</span>
                  <span className="font-semibold text-foreground">{resolvingTicket.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Staff Member:</span>
                  <span className="text-foreground">{resolvingTicket.userName}</span>
                </div>
                {resolvingTicket.itemName && (
                  <div className="flex justify-between">
                    <span className="text-muted">Assigned Device:</span>
                    <span className="font-mono text-foreground">{resolvingTicket.itemName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Work Done / Resolution Summary (optional)
                </label>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Replaced display panel, reinstalled drivers, verified hardware diagnostic passes."
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs text-foreground placeholder:text-muted focus:border-brand-teal focus:outline-hidden focus:ring-1 focus:ring-brand-teal"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={resolvingSaving}
                  onClick={() => setResolvingTicket(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={resolvingSaving}
                  onClick={async () => {
                    setResolvingSaving(true);
                    await handleUpdateStatus(resolvingTicket.id, "resolved", resolutionNotes);
                  }}
                  leftIcon={
                    resolvingSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )
                  }
                >
                  {resolvingSaving ? "Resolving..." : "Mark as Resolved"}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
