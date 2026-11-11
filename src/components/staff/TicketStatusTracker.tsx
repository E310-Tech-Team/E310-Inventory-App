"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ComplaintStatus, DeviceComplaint, StaffDevice } from "@/types";
import { subscribeToTicketUpdates } from "@/lib/sync/ticket-broadcast";
import { formatDateTime, formatCompactDateTime } from "@/lib/format-date";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { ReportIssueModal } from "@/components/staff/ReportIssueModal";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";
import {
  PriorityCriticalIcon,
  PriorityHighIcon,
  PriorityMediumIcon,
  PriorityLowIcon,
} from "@/components/common/Icons";
import {
  LifeBuoy,
  Search,
  Clock,
  CheckCircle2,
  Copy,
  Check,
  Laptop,
  Plus,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  ExternalLink,
  AppWindow,
  X,
} from "lucide-react";

type LegacyDeviceComplaint = DeviceComplaint & {
  ticket_number?: string;
  created_at?: string;
  resolved_at?: string | null;
};

interface TicketStatusTrackerProps {
  initialComplaints: DeviceComplaint[];
  devices?: StaffDevice[];
}

type TabFilter = "all" | "active" | "resolved";

interface StageConfig {
  step: number;
  label: string;
  compactLabel: string;
  sublabel: string;
}

const STAGES: StageConfig[] = [
  { step: 1, label: "Submitted", compactLabel: "Submitted", sublabel: "Logged in queue" },
  { step: 2, label: "Triage & Review", compactLabel: "Triage", sublabel: "Assigned to tech" },
  { step: 3, label: "In Diagnostic / Repair", compactLabel: "In Repair", sublabel: "Bench work active" },
  { step: 4, label: "Resolved", compactLabel: "Resolved", sublabel: "Ready & returned" },
];

interface ParsedTicketDetails {
  cleanDescription: string;
  affectedApp: string | null;
  osVersion: string | null;
  location: string | null;
}

function parseTicketDescription(raw: string = ""): ParsedTicketDetails {
  let cleanDescription = raw || "";
  let affectedApp: string | null = null;
  let osVersion: string | null = null;
  let location: string | null = null;

  const appMatch = cleanDescription.match(/\[Affected Application\]:\s*([^\n]+)/i);
  if (appMatch) {
    affectedApp = appMatch[1].trim();
    cleanDescription = cleanDescription.replace(appMatch[0], "");
  }

  const osMatch = cleanDescription.match(/\[Environment \/ OS Version\]:\s*([^\n]+)/i);
  if (osMatch) {
    osVersion = osMatch[1].trim();
    cleanDescription = cleanDescription.replace(osMatch[0], "");
  }

  const locMatch = cleanDescription.match(/\[Physical Location \/ Desk\]:\s*([^\n]+)/i);
  if (locMatch) {
    location = locMatch[1].trim();
    cleanDescription = cleanDescription.replace(locMatch[0], "");
  }

  return {
    cleanDescription: cleanDescription.trim(),
    affectedApp,
    osVersion,
    location,
  };
}

function parseIssueType(rawType: string = "") {
  let domain = "Hardware";
  let cleanType = rawType || "Service Request";
  if (rawType.startsWith("[Software]")) {
    domain = "Software";
    cleanType = rawType.replace("[Software]", "").trim();
  } else if (rawType.startsWith("[Hardware]")) {
    domain = "Hardware";
    cleanType = rawType.replace("[Hardware]", "").trim();
  }
  return { domain, cleanType };
}

function getStageIndex(status: string): number {
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

function getPriorityConfig(priority: string) {
  switch (priority.toLowerCase()) {
    case "critical":
      return {
        label: "Critical",
        icon: PriorityCriticalIcon,
        badgeClass: "bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/30",
        indicatorDot: "bg-rose-500",
      };
    case "high":
      return {
        label: "High",
        icon: PriorityHighIcon,
        badgeClass: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
        indicatorDot: "bg-orange-500",
      };
    case "medium":
      return {
        label: "Medium",
        icon: PriorityMediumIcon,
        badgeClass: "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30",
        indicatorDot: "bg-amber-500",
      };
    case "low":
    default:
      return {
        label: "Low",
        icon: PriorityLowIcon,
        badgeClass: "bg-sky-500/10 text-sky-600 dark:text-sky-300 border-sky-500/30",
        indicatorDot: "bg-sky-500",
      };
  }
}

export function TicketStatusTracker({
  initialComplaints,
  devices = [],
}: TicketStatusTrackerProps) {
  const [complaints, setComplaints] = useState<DeviceComplaint[]>(initialComplaints);
  const [activeTab, setActiveTab] = useState<TabFilter>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<DeviceComplaint | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [mobileLimit, setMobileLimit] = useState(5);

  const refreshTickets = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/staff/complaints");
      if (res.ok) {
        const data = await res.json();
        const refreshed: DeviceComplaint[] = data.complaints || [];
        setComplaints(refreshed);
        setSelectedTicket((prev) =>
          prev ? refreshed.find((item) => item.id === prev.id) ?? prev : null
        );
      }
    } catch (err) {
      console.warn("Failed to refresh tickets:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Real-time synchronization: updates instantly when tech progresses ticket
  useEffect(() => {
    const unsubscribe = subscribeToTicketUpdates((payload) => {
      if (payload?.ticketId && payload?.status) {
        const nextStatus = payload.status as ComplaintStatus;
        const isClosed = nextStatus === "resolved" || nextStatus === "closed";
        const eventIso = new Date(payload.timestamp || Date.now()).toISOString();

        const patchTicket = (t: DeviceComplaint): DeviceComplaint => ({
          ...t,
          status: nextStatus,
          resolvedAt: isClosed
            ? t.resolvedAt || eventIso
            : t.status === "resolved" || t.status === "closed"
            ? null
            : t.resolvedAt,
        });

        setComplaints((prev) =>
          prev.map((t) => (t.id === payload.ticketId ? patchTicket(t) : t))
        );
        setSelectedTicket((prev) =>
          prev && prev.id === payload.ticketId ? patchTicket(prev) : prev
        );
      }
      refreshTickets();
    });

    return () => unsubscribe();
  }, []);

  const handleCopy = (ticketNumber: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigator.clipboard.writeText(ticketNumber);
    setCopiedTicketId(ticketNumber);
    setTimeout(() => setCopiedTicketId(null), 2000);
  };

  // Metrics
  const activeTickets = useMemo(
    () =>
      complaints.filter(
        (c) =>
          c.status !== "resolved" &&
          c.status !== "closed" &&
          c.status !== "cancelled"
      ),
    [complaints]
  );

  const inProgressTickets = useMemo(
    () =>
      complaints.filter((c) =>
        ["under-review", "assigned", "in-repair", "in-progress", "waiting-parts"].includes(
          c.status.toLowerCase()
        )
      ),
    [complaints]
  );

  const resolvedTickets = useMemo(
    () =>
      complaints.filter(
        (c) => c.status === "resolved" || c.status === "closed"
      ),
    [complaints]
  );

  // Filtered List
  const filteredTickets = useMemo(() => {
    return complaints.filter((ticket) => {
      // Tab filter
      if (activeTab === "active") {
        if (
          ticket.status === "resolved" ||
          ticket.status === "closed" ||
          ticket.status === "cancelled"
        ) {
          return false;
        }
      } else if (activeTab === "resolved") {
        if (ticket.status !== "resolved" && ticket.status !== "closed") {
          return false;
        }
      }

      // Query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const legacy = ticket as LegacyDeviceComplaint;
        const ticketNum = (ticket.ticketNumber || legacy.ticket_number || "").toLowerCase();
        const matchesNumber = ticketNum.includes(query);
        const matchesTitle = ticket.title.toLowerCase().includes(query);
        const matchesCategory = ticket.issueType.toLowerCase().includes(query);
        const matchesDevice =
          ticket.itemName?.toLowerCase().includes(query) ||
          ticket.itemSerial?.toLowerCase().includes(query);

        return matchesNumber || matchesTitle || matchesCategory || matchesDevice;
      }

      return true;
    });
  }, [complaints, activeTab, searchQuery]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* ─── Top Control Bar & Stats ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Support Tickets
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-elevated text-muted border border-border/70 tabular-nums">
              {complaints.length} Total
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">
            Real-time diagnostic progress, technician notes, and repair updates for your assigned equipment.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="justify-center whitespace-nowrap"
            onClick={refreshTickets}
            disabled={isRefreshing}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            }
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            className="justify-center whitespace-nowrap"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            File Request
          </Button>
        </div>
      </div>

      {/* ─── Summary Counter Cards ─── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div
          className={`rounded-2xl border p-3 sm:p-5 flex flex-col justify-between transition-colors shadow-[0_1px_4px_rgba(0,0,0,0.02)] ${
            activeTickets.length > 0
              ? "border-amber-500/35 bg-amber-50/40 dark:bg-amber-950/15"
              : "border-border/70 bg-surface"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div
              className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center border shrink-0 ${
                activeTickets.length > 0
                  ? "bg-amber-500/15 border-amber-500/25 text-amber-600 dark:text-amber-400"
                  : "bg-surface-hover/80 border-border/60 text-muted"
              }`}
            >
              <LifeBuoy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span
              className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                activeTickets.length > 0
                  ? "bg-surface border-amber-500/30 text-amber-700 dark:text-amber-300"
                  : "bg-surface-hover/70 border-border/60 text-muted"
              }`}
            >
              {activeTickets.length > 0 ? "Open" : "Clear"}
            </span>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {activeTickets.length}
            </p>
            <p className="text-[11px] sm:text-xs font-medium text-foreground mt-0.5 truncate">
              <span className="sm:hidden">Active</span>
              <span className="hidden sm:inline">Active Requests</span>
            </p>
            <p className="hidden sm:block text-[11px] text-muted mt-0.5 truncate">
              Awaiting or undergoing service
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 flex flex-col justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-2">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 shrink-0">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-hover/70 border border-border/60 text-muted">
              {inProgressTickets.length > 0 ? "In Service" : "Standby"}
            </span>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {inProgressTickets.length}
            </p>
            <p className="text-[11px] sm:text-xs font-medium text-foreground mt-0.5 truncate">
              <span className="sm:hidden">Bench</span>
              <span className="hidden sm:inline">In Bench / Triage</span>
            </p>
            <p className="hidden sm:block text-[11px] text-muted mt-0.5 truncate">
              Assigned to IT specialist
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 flex flex-col justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-2">
            <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl flex items-center justify-center bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-surface-hover/70 border border-border/60 text-muted">
              Closed
            </span>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground tabular-nums">
              {resolvedTickets.length}
            </p>
            <p className="text-[11px] sm:text-xs font-medium text-foreground mt-0.5 truncate">
              <span className="sm:hidden">Resolved</span>
              <span className="hidden sm:inline">Resolved &amp; Returned</span>
            </p>
            <p className="hidden sm:block text-[11px] text-muted mt-0.5 truncate">
              Completed successfully
            </p>
          </div>
        </div>
      </div>

      {/* ─── Search & Tab Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 pt-0.5 sm:pt-1">
        {/* Tabs */}
        <div className="w-full sm:w-auto grid grid-cols-3 sm:inline-flex rounded-xl bg-surface-elevated/70 p-0.5 border border-border/70">
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setMobileLimit(5);
            }}
            className={`justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "all"
                ? "bg-surface text-foreground border border-border/60 shadow-2xs"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <span>All</span>
            <span className="text-[11px] text-muted tabular-nums">
              {complaints.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("active");
              setMobileLimit(5);
            }}
            className={`justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "active"
                ? "bg-surface text-foreground border border-border/60 shadow-2xs"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <span>Active</span>
            <span className="text-[11px] text-muted tabular-nums">
              {activeTickets.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("resolved");
              setMobileLimit(5);
            }}
            className={`justify-center px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === "resolved"
                ? "bg-surface text-foreground border border-border/60 shadow-2xs"
                : "text-muted hover:text-foreground border border-transparent"
            }`}
          >
            <span>Resolved</span>
            <span className="text-[11px] text-muted tabular-nums">
              {resolvedTickets.length}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder="Search tickets by #, title, device..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setMobileLimit(5);
            }}
            className="w-full h-10 sm:h-9 pl-9 pr-8 text-xs rounded-xl border border-border/70 bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setMobileLimit(5);
              }}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ─── Ticket List / Cards with Progress Pipeline ─── */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl py-12 px-6 text-center border border-dashed border-border/80 bg-surface/60">
          <div className="mx-auto w-11 h-11 rounded-full bg-surface-elevated border border-border/70 flex items-center justify-center text-muted mb-3">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery
              ? "No matching tickets found"
              : activeTab === "active"
              ? "No active support requests"
              : activeTab === "resolved"
              ? "No resolved tickets yet"
              : "No Support Requests on File"}
          </h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No requests match "${searchQuery}". Clear your search query or tab filter.`
              : activeTab === "active"
              ? "All your equipment is running smoothly with no open support tickets."
              : activeTab === "resolved"
              ? "Completed and resolved IT requests will appear here once closed."
              : "All your equipment is in optimal health. If you experience any defect, file a service request."}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
            {!searchQuery && activeTab === "active" && resolvedTickets.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab("resolved");
                  setMobileLimit(5);
                }}
                className="text-xs font-medium text-brand-teal hover:underline px-2 py-1.5"
              >
                View {resolvedTickets.length} resolved{" "}
                {resolvedTickets.length === 1 ? "ticket" : "tickets"}
              </button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsReportModalOpen(true)}
              leftIcon={<Plus className="w-3.5 h-3.5" />}
            >
              File a Service Ticket
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-2.5 sm:space-y-3">
            {filteredTickets.map((ticket, idx) => {
              const legacy = ticket as LegacyDeviceComplaint;
              const ticketNum = ticket.ticketNumber || legacy.ticket_number || "TKT";
              const createdTimestamp = ticket.createdAt || legacy.created_at;
              const resolvedTimestamp = ticket.resolvedAt || legacy.resolved_at;
              const currentStage = getStageIndex(ticket.status);
              const { cleanDescription, affectedApp } = parseTicketDescription(ticket.description);
              const { cleanType } = parseIssueType(ticket.issueType);

              return (
                <div
                  key={ticket.id}
                  className={`${
                    idx >= mobileLimit ? "hidden sm:block" : "block"
                  } p-3.5 sm:p-5 hover:border-border bg-surface border border-border/70 rounded-2xl shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all cursor-pointer group space-y-2 sm:space-y-3`}
                  onClick={() => setSelectedTicket(ticket)}
                >
                  {/* Header Row: Ticket # + Status + Title + Date & Action */}
                  <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                    <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
                      {/* Pills & Meta */}
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-muted tracking-tight">
                          {ticketNum}
                        </span>

                        <Badge
                          variant={
                            ticket.status === "resolved"
                              ? "resolved"
                              : ticket.status === "in-repair"
                              ? "in-repair"
                              : ticket.status === "under-review"
                              ? "under-review"
                              : "submitted"
                          }
                          label={ticket.status.replace("-", " ")}
                        />

                        {ticket.priority && (() => {
                          const prio = getPriorityConfig(ticket.priority);
                          const PrioIcon = prio.icon;
                          return (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${prio.badgeClass}`}
                            >
                              <PrioIcon className="w-3 h-3" />
                              <span>{prio.label}</span>
                            </span>
                          );
                        })()}

                        <span className="text-xs text-muted/70 truncate hidden sm:inline">
                          • {cleanType}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors truncate">
                        {ticket.title}
                      </h3>
                    </div>

                    {/* Right: Date & Action */}
                    <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-muted shrink-0 pt-0.5 tabular-nums">
                      <span className="sm:hidden">{formatCompactDateTime(createdTimestamp)}</span>
                      <span className="hidden sm:inline">{formatDateTime(createdTimestamp)}</span>
                      <span className="text-muted/60 group-hover:text-accent group-hover:translate-x-0.5 transition-all hidden sm:inline-flex items-center gap-1 font-medium">
                        Details
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted/60 group-hover:text-accent sm:hidden" />
                    </div>
                  </div>

                  {/* Description summary (desktop/tablet) */}
                  {cleanDescription && (
                    <p className="hidden sm:block text-xs text-muted line-clamp-1">
                      {cleanDescription}
                    </p>
                  )}

                  {/* Context Tag: Device, Software, and Resolved Timestamp */}
                  {(ticket.itemName || affectedApp || resolvedTimestamp) && (
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted min-w-0">
                      {ticket.itemName ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-elevated/60 border border-border/60 text-foreground/80 min-w-0 max-w-full">
                          <Laptop className="w-3 h-3 text-muted shrink-0" />
                          <span className="truncate max-w-[140px] sm:max-w-[220px]">{ticket.itemName}</span>
                          {ticket.itemSerial && (
                            <span className="font-mono text-[10px] text-muted truncate max-w-[90px] sm:max-w-none">
                              ({ticket.itemSerial})
                            </span>
                          )}
                        </span>
                      ) : affectedApp ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-elevated/60 border border-border/60 text-foreground/80 min-w-0 max-w-full">
                          <AppWindow className="w-3 h-3 text-muted shrink-0" />
                          <span className="truncate max-w-[160px] sm:max-w-[220px]">{affectedApp}</span>
                        </span>
                      ) : null}

                      <span className="text-muted/70 text-[11px] sm:hidden truncate max-w-full">
                        • {cleanType}
                      </span>

                      {resolvedTimestamp && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/8 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-medium tabular-nums">
                          <CheckCircle2 className="w-3 h-3 shrink-0" />
                          <span>Resolved {formatDateTime(resolvedTimestamp)}</span>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Sleek, Minimal Stepper Line */}
                  <div className="pt-2 border-t border-border/40">
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {STAGES.map((stg) => {
                        const isComplete = currentStage > stg.step;
                        const isCurrent = currentStage === stg.step;

                        return (
                          <div key={stg.step} className="space-y-0.5 sm:space-y-1">
                            <div
                              className={`h-1 rounded-full transition-colors ${
                                isComplete
                                  ? "bg-emerald-500"
                                  : isCurrent
                                  ? "bg-amber-400"
                                  : "bg-surface-elevated"
                              }`}
                            />
                            <span
                              className={`block text-[10px] sm:text-[11px] truncate leading-tight ${
                                isComplete
                                  ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                  : isCurrent
                                  ? "text-foreground font-semibold"
                                  : "text-muted/60"
                              }`}
                            >
                              {stg.compactLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="sm:hidden">
            <ShowMoreBar
              visibleCount={Math.min(mobileLimit, filteredTickets.length)}
              totalCount={filteredTickets.length}
              initialLimit={5}
              noun="tickets"
              standalone
              onShowMore={() => setMobileLimit((prev) => prev + 5)}
              onCollapse={() => setMobileLimit(5)}
            />
          </div>
        </>
      )}

      {/* ─── Ticket Details Modal ─── */}
      {selectedTicket && (() => {
        const selectedLegacy = selectedTicket as LegacyDeviceComplaint;
        const selectedStage = getStageIndex(selectedTicket.status);
        const selectedParsed = parseTicketDescription(selectedTicket.description);
        const { cleanType: modalCategory } = parseIssueType(selectedTicket.issueType);
        const ticketNum = selectedTicket.ticketNumber || selectedLegacy.ticket_number || "TKT";
        const createdTimestamp = selectedTicket.createdAt || selectedLegacy.created_at;
        const resolvedTimestamp = selectedTicket.resolvedAt || selectedLegacy.resolved_at;
        const isResolvedTicket =
          selectedTicket.status === "resolved" || selectedTicket.status === "closed";

        return (
          <Modal
            isOpen={Boolean(selectedTicket)}
            onClose={() => setSelectedTicket(null)}
            title={`Ticket Details — ${ticketNum}`}
            description="Full diagnostic report and IT support resolution timeline."
            size="lg"
          >
            <div className="space-y-4 sm:space-y-5 animate-fade-in text-xs">
              {/* Ticket Header & Status Pills */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl bg-surface-elevated/40 border border-border/70">
                <div className="space-y-0.5 min-w-0">
                  <span className="text-[11px] text-muted">Status &amp; Priority</span>
                  <div className="flex items-center gap-2 pt-0.5 flex-wrap">
                    <Badge
                      variant={
                        selectedTicket.status === "resolved"
                          ? "resolved"
                          : selectedTicket.status === "in-repair"
                          ? "in-repair"
                          : selectedTicket.status === "under-review"
                          ? "under-review"
                          : "submitted"
                      }
                      label={selectedTicket.status.replace("-", " ")}
                    />
                    <span className="px-2 py-0.5 rounded-full border border-border/70 bg-surface text-[11px] font-medium text-foreground/90 capitalize">
                      {selectedTicket.priority} priority
                    </span>
                    <span className="text-muted text-[11px]">
                      • {modalCategory}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-start gap-x-5 gap-y-2 sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                  <div className="space-y-0.5">
                    <span className="text-[11px] text-muted block">Created On</span>
                    <p className="font-mono text-foreground tabular-nums">
                      {formatDateTime(createdTimestamp)}
                    </p>
                  </div>

                  {(resolvedTimestamp || isResolvedTicket) && (
                    <div className="space-y-0.5">
                      <span className="text-[11px] text-emerald-700 dark:text-emerald-400 block">
                        Resolved On
                      </span>
                      <p className="font-mono font-medium text-emerald-700 dark:text-emerald-300 tabular-nums">
                        {resolvedTimestamp ? formatDateTime(resolvedTimestamp) : "Completed"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Pipeline inside Modal */}
              <div className="p-3 sm:p-3.5 rounded-xl bg-surface-elevated/40 border border-border/70 space-y-2">
                <span className="text-[11px] text-muted font-medium block">
                  Service Pipeline Progress
                </span>
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-1">
                  {STAGES.map((stg) => {
                    const isComplete = selectedStage > stg.step;
                    const isCurrent = selectedStage === stg.step;

                    return (
                      <div key={stg.step} className="space-y-1 sm:space-y-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-colors ${
                            isComplete
                              ? "bg-emerald-500"
                              : isCurrent
                              ? "bg-amber-500"
                              : "bg-surface-elevated"
                          }`}
                        />
                        <div className="flex flex-col">
                          <span
                            className={`text-[10px] sm:text-[11px] font-medium leading-tight truncate ${
                              isComplete
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isCurrent
                                ? "text-foreground font-semibold"
                                : "text-muted"
                            }`}
                          >
                            <span className="sm:hidden">{stg.compactLabel}</span>
                            <span className="hidden sm:inline">{stg.label}</span>
                          </span>
                          <span className="text-[10px] text-muted hidden sm:block truncate">
                            {stg.sublabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Affected Hardware Device OR Software App */}
              {selectedTicket.itemName ? (
                <div className="p-3 sm:p-3.5 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-foreground/90 shrink-0">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {selectedTicket.itemName}
                      </h4>
                      <p className="text-[11px] text-muted font-mono truncate">
                        Serial: {selectedTicket.itemSerial || "N/A"}
                      </p>
                    </div>
                  </div>
                  <span className="self-start sm:self-center shrink-0 text-[11px] text-muted bg-surface-elevated px-2.5 py-1 rounded-md border border-border">
                    Assigned Device
                  </span>
                </div>
              ) : selectedParsed.affectedApp ? (
                <div className="p-3 sm:p-3.5 rounded-xl bg-surface border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-foreground/90 shrink-0">
                      <AppWindow className="w-5 h-5 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-foreground truncate">
                        {selectedParsed.affectedApp}
                      </h4>
                      {selectedParsed.osVersion && (
                        <p className="text-[11px] text-muted truncate">
                          OS / Environment: {selectedParsed.osVersion}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="self-start sm:self-center shrink-0 text-[11px] text-muted bg-surface-elevated px-2.5 py-1 rounded-md border border-border">
                    Software Application
                  </span>
                </div>
              ) : null}

              {/* Desk / Physical Location */}
              {selectedParsed.location && (
                <div className="px-3.5 py-2.5 rounded-xl bg-surface border border-border flex items-center gap-2">
                  <span className="text-muted">Desk / Location:</span>
                  <span className="font-medium text-foreground">{selectedParsed.location}</span>
                </div>
              )}

              {/* Issue Description */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Summary & Defect Description
                </h4>
                <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2">
                  <h5 className="text-sm font-semibold text-foreground">
                    {selectedTicket.title}
                  </h5>
                  <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap text-xs">
                    {selectedParsed.cleanDescription || selectedTicket.description}
                  </p>
                </div>
              </div>

              {/* Attachments */}
              {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Photo / Evidence Attachments ({selectedTicket.attachmentUrls.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {selectedTicket.attachmentUrls.map((url, idx) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-2.5 rounded-xl bg-surface border border-border hover:border-accent hover:bg-surface-elevated text-foreground transition-all"
                      >
                        <div className="w-12 h-12 rounded-lg bg-surface-elevated border border-border overflow-hidden shrink-0 flex items-center justify-center">
                          <img
                            src={url}
                            alt={`Evidence #${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">
                            Photo #{idx + 1}
                          </p>
                          <p className="text-[10px] text-muted truncate max-w-[150px]">
                            {url.startsWith("data:") ? "Direct Image Upload" : url}
                          </p>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-muted group-hover:text-foreground shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Technician Notes & Resolution */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  IT Diagnostics & Resolution Notes
                </h4>
                <div className="p-4 rounded-xl bg-surface border border-border space-y-3">
                  <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                    <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {selectedTicket.assignedTechName || "E310 IT Support Team"}
                      </p>
                      <p className="text-[10px] text-muted">
                        Primary Assigned Technician
                      </p>
                    </div>
                  </div>

                  {selectedTicket.techNotes ? (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-semibold text-muted">
                        Bench / Triage Notes:
                      </span>
                      <p className="text-xs text-foreground/90 bg-surface-elevated p-2.5 rounded-lg border border-border">
                        {selectedTicket.techNotes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted italic">
                      Ticket is queued for bench diagnostics. Notes will appear here as the technician conducts repairs.
                    </p>
                  )}

                  {(selectedTicket.resolutionSummary || resolvedTimestamp) && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                          Final Resolution:
                        </span>
                        {resolvedTimestamp && (
                          <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
                            {formatDateTime(resolvedTimestamp)}
                          </span>
                        )}
                      </div>
                      {selectedTicket.resolutionSummary && (
                        <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                          {selectedTicket.resolutionSummary}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 border-t border-border/60">
                <button
                  type="button"
                  onClick={() => handleCopy(ticketNum)}
                  className="flex items-center justify-center sm:justify-start gap-1.5 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                >
                  {copiedTicketId === ticketNum ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>Copy Ticket ID</span>
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto justify-center"
                  onClick={() => setSelectedTicket(null)}
                >
                  Close Details
                </Button>
              </div>
            </div>
          </Modal>
        );
      })()}

      {/* ─── File New Request Modal ─── */}
      <ReportIssueModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => {
          refreshTickets();
        }}
        devices={devices}
      />
    </div>
  );
}
