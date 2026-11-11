"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ComplaintStatus, DeviceComplaint, StaffDevice } from "@/types";
import { subscribeToTicketUpdates } from "@/lib/sync/ticket-broadcast";
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
} from "lucide-react";

type LegacyDeviceComplaint = DeviceComplaint & {
  ticket_number?: string;
  created_at?: string;
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

function formatTicketDate(dateValue?: string | null): string {
  if (!dateValue) return "Recently";
  const d = new Date(dateValue);
  return isNaN(d.getTime())
    ? "Recently"
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function formatTicketDateTime(dateValue?: string | null): string {
  if (!dateValue) return "Recently";
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? "Recently" : d.toLocaleString();
}

export function TicketStatusTracker({
  initialComplaints,
  devices = [],
}: TicketStatusTrackerProps) {
  const [complaints, setComplaints] = useState<DeviceComplaint[]>(initialComplaints);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedTicket, setSelectedTicket] = useState<DeviceComplaint | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [copiedTicketId, setCopiedTicketId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileLimit, setMobileLimit] = useState(5);

  const refreshTickets = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch("/api/staff/complaints");
      if (res.ok) {
        const data = await res.json();
        setComplaints(data.complaints || []);
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
        setComplaints((prev) =>
          prev.map((t) =>
            t.id === payload.ticketId
              ? { ...t, status: nextStatus }
              : t
          )
        );
        setSelectedTicket((prev) =>
          prev && prev.id === payload.ticketId
            ? { ...prev, status: nextStatus }
            : prev
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

        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="justify-center"
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
            className="justify-center"
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            File Request
          </Button>
        </div>
      </div>

      {/* ─── Summary Counter Cards ─── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-muted truncate">
              <span className="sm:hidden">Active</span>
              <span className="hidden sm:inline">Active Requests</span>
            </span>
            <span className="flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground tabular-nums mt-1 sm:mt-2">
            {activeTickets.length}
          </p>
          <p className="hidden sm:block text-[11px] text-muted mt-1">Awaiting or undergoing service</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-muted truncate">
              <span className="sm:hidden">Bench</span>
              <span className="hidden sm:inline">In Bench / Triage</span>
            </span>
            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-sky-500 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground tabular-nums mt-1 sm:mt-2">
            {inProgressTickets.length}
          </p>
          <p className="hidden sm:block text-[11px] text-muted mt-1">Assigned to IT specialist</p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[11px] sm:text-xs font-medium text-muted truncate">
              <span className="sm:hidden">Resolved</span>
              <span className="hidden sm:inline">Resolved &amp; Returned</span>
            </span>
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500 shrink-0" />
          </div>
          <p className="text-lg sm:text-2xl font-bold tracking-tight text-foreground tabular-nums mt-1 sm:mt-2">
            {resolvedTickets.length}
          </p>
          <p className="hidden sm:block text-[11px] text-muted mt-1">Completed successfully</p>
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
            className="w-full h-9 pl-8.5 pr-3 text-xs rounded-xl border border-border/70 bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
          />
        </div>
      </div>

      {/* ─── Ticket List / Cards with Progress Pipeline ─── */}
      {filteredTickets.length === 0 ? (
        <div className="rounded-2xl py-12 px-6 text-center border border-dashed border-border/80 bg-surface/60">
          <div className="mx-auto w-11 h-11 rounded-full bg-surface-elevated border border-border/70 flex items-center justify-center text-muted mb-3">
            <LifeBuoy className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">
            {searchQuery ? "No matching tickets found" : "No Support Requests on File"}
          </h3>
          <p className="text-xs text-muted max-w-sm mx-auto mt-1">
            {searchQuery
              ? `No requests match "${searchQuery}". Clear your search query or tab filter.`
              : "All your equipment is in optimal health. If you experience any defect, file a service request."}
          </p>
          <div className="mt-4">
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
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted shrink-0 pt-0.5 tabular-nums">
                      <span>{formatTicketDate(ticket.createdAt || legacy.created_at)}</span>
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

                  {/* Context Tag: Device or Software (clean, subtle inline) */}
                  {(ticket.itemName || affectedApp) && (
                    <div className="flex items-center gap-2 text-[11px] text-muted">
                      {ticket.itemName ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-elevated/60 border border-border/60 text-foreground/80">
                          <Laptop className="w-3 h-3 text-muted shrink-0" />
                          <span className="truncate max-w-[160px] sm:max-w-[220px]">{ticket.itemName}</span>
                          {ticket.itemSerial && (
                            <span className="font-mono text-[10px] text-muted">
                              ({ticket.itemSerial})
                            </span>
                          )}
                        </span>
                      ) : affectedApp ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-surface-elevated/60 border border-border/60 text-foreground/80">
                          <AppWindow className="w-3 h-3 text-muted shrink-0" />
                          <span className="truncate max-w-[160px] sm:max-w-[220px]">{affectedApp}</span>
                        </span>
                      ) : null}

                      <span className="text-muted/70 text-[11px] sm:hidden truncate">
                        • {cleanType}
                      </span>
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

        return (
          <Modal
            isOpen={Boolean(selectedTicket)}
            onClose={() => setSelectedTicket(null)}
            title={`Ticket Details — ${ticketNum}`}
            description="Full diagnostic report and IT support resolution timeline."
            size="lg"
          >
            <div className="space-y-5 animate-fade-in text-xs">
              {/* Ticket Header & Status Pills */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-elevated/40 border border-border/70">
                <div className="space-y-0.5">
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

                <div className="text-right space-y-0.5 shrink-0">
                  <span className="text-[11px] text-muted">Created On</span>
                  <p className="font-mono text-foreground tabular-nums">
                    {formatTicketDateTime(selectedTicket.createdAt || selectedLegacy.created_at)}
                  </p>
                </div>
              </div>

              {/* Progress Pipeline inside Modal */}
              <div className="p-3.5 rounded-xl bg-surface-elevated/40 border border-border/70 space-y-2">
                <span className="text-[11px] text-muted font-medium block">
                  Service Pipeline Progress
                </span>
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {STAGES.map((stg) => {
                    const isComplete = selectedStage > stg.step;
                    const isCurrent = selectedStage === stg.step;

                    return (
                      <div key={stg.step} className="space-y-1.5">
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
                            className={`text-[11px] font-medium leading-tight truncate ${
                              isComplete
                                ? "text-emerald-600 dark:text-emerald-400"
                                : isCurrent
                                ? "text-foreground font-semibold"
                                : "text-muted"
                            }`}
                          >
                            {stg.label}
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
                <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-foreground/90">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {selectedTicket.itemName}
                      </h4>
                      <p className="text-[11px] text-muted font-mono">
                        Serial: {selectedTicket.itemSerial || "N/A"}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-muted bg-surface-elevated px-2.5 py-1 rounded-md border border-border">
                    Assigned Device
                  </span>
                </div>
              ) : selectedParsed.affectedApp ? (
                <div className="p-3.5 rounded-xl bg-surface border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-surface-elevated border border-border flex items-center justify-center text-foreground/90">
                      <AppWindow className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">
                        {selectedParsed.affectedApp}
                      </h4>
                      {selectedParsed.osVersion && (
                        <p className="text-[11px] text-muted">
                          OS / Environment: {selectedParsed.osVersion}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted bg-surface-elevated px-2.5 py-1 rounded-md border border-border">
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

                  {selectedTicket.resolutionSummary && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] uppercase font-semibold text-emerald-600 dark:text-emerald-400">
                        Final Resolution:
                      </span>
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20">
                        {selectedTicket.resolutionSummary}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 flex items-center justify-between border-t border-border/60">
                <button
                  type="button"
                  onClick={() => handleCopy(ticketNum)}
                  className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
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
