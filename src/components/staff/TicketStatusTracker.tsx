"use client";

import React, { useState, useMemo } from "react";
import { DeviceComplaint, StaffDevice } from "@/types";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { ReportIssueModal } from "@/components/staff/ReportIssueModal";
import {
  LifeBuoy,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Laptop,
  Calendar,
  UserCheck,
  Plus,
  RefreshCw,
  Flame,
  Zap,
  ArrowRight,
  ImageIcon,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";

interface TicketStatusTrackerProps {
  initialComplaints: DeviceComplaint[];
  devices?: StaffDevice[];
}

type TabFilter = "all" | "active" | "resolved";

interface StageConfig {
  step: number;
  label: string;
  sublabel: string;
}

const STAGES: StageConfig[] = [
  { step: 1, label: "Submitted", sublabel: "Logged in queue" },
  { step: 2, label: "Triage & Review", sublabel: "Assigned to tech" },
  { step: 3, label: "In Diagnostic / Repair", sublabel: "Bench work active" },
  { step: 4, label: "Resolved", sublabel: "Ready & returned" },
];

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
        icon: Flame,
        badgeClass: "bg-rose-500/10 text-rose-400 border-rose-500/20",
        indicatorDot: "bg-rose-500",
      };
    case "high":
      return {
        label: "High",
        icon: AlertTriangle,
        badgeClass: "bg-orange-500/10 text-orange-400 border-orange-500/20",
        indicatorDot: "bg-orange-500",
      };
    case "medium":
      return {
        label: "Medium",
        icon: Zap,
        badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
        indicatorDot: "bg-amber-400",
      };
    case "low":
    default:
      return {
        label: "Low",
        icon: Clock,
        badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20",
        indicatorDot: "bg-sky-400",
      };
  }
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
        const matchesNumber = ticket.ticketNumber.toLowerCase().includes(query);
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
    <div className="space-y-6 animate-fade-in">
      {/* ─── Top Control Bar & Stats ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Support Tickets & Status Tracker
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-surface-subtle text-foreground border border-border">
              {complaints.length} Total
            </span>
          </div>
          <p className="text-sm text-muted mt-1">
            Real-time diagnostic progress, technician notes, and repair updates for your assigned equipment.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
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
            onClick={() => setIsReportModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            File New Request
          </Button>
        </div>
      </div>

      {/* ─── Summary Counter Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Active Requests</span>
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {activeTickets.length}
          </p>
          <p className="text-[11px] text-muted mt-1">Under inspection or repair</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Resolved & Returned</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            {resolvedTickets.length}
          </p>
          <p className="text-[11px] text-muted mt-1">Completed successfully</p>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted">Average Turnaround</span>
            <Clock className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            &lt; 24h
          </p>
          <p className="text-[11px] text-muted mt-1">E310 IT triage standard</p>
        </Card>
      </div>

      {/* ─── Search & Tab Filters ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        {/* Tabs */}
        <div className="inline-flex rounded-lg bg-surface-subtle border border-border p-1">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "all"
                ? "bg-surface text-foreground shadow-xs font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            All Tickets ({complaints.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("active")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "active"
                ? "bg-surface text-foreground shadow-xs font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            Active ({activeTickets.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("resolved")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === "resolved"
                ? "bg-surface text-foreground shadow-xs font-semibold"
                : "text-muted hover:text-foreground"
            }`}
          >
            Resolved ({resolvedTickets.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search tickets by #, title, device..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-ring transition-colors"
          />
        </div>
      </div>

      {/* ─── Ticket List / Cards with Progress Pipeline ─── */}
      {filteredTickets.length === 0 ? (
        <Card className="py-12 px-6 text-center border-dashed border-border">
          <div className="mx-auto w-12 h-12 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-muted mb-3">
            <LifeBuoy className="w-6 h-6" />
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
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((ticket) => {
            const currentStage = getStageIndex(ticket.status);
            const priorityCfg = getPriorityConfig(ticket.priority);
            const PriorityIcon = priorityCfg.icon;

            return (
              <Card
                key={ticket.id}
                className="p-5 hover:border-border transition-all cursor-pointer group space-y-4"
                onClick={() => setSelectedTicket(ticket)}
              >
                {/* Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-border">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Ticket Number & Copy */}
                    <div className="flex items-center gap-1.5 bg-surface-subtle border border-border px-2.5 py-1 rounded-md">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {ticket.ticketNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(ticket.ticketNumber, e)}
                        className="text-muted hover:text-foreground transition-colors p-0.5 rounded"
                        title="Copy Ticket ID"
                      >
                        {copiedTicketId === ticket.ticketNumber ? (
                          <Check className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>

                    {/* Status Badge */}
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

                    {/* Priority Badge */}
                    <div
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-medium ${priorityCfg.badgeClass}`}
                    >
                      <PriorityIcon className="w-3 h-3" />
                      <span>{priorityCfg.label}</span>
                    </div>

                    <span className="text-xs text-muted">
                      • {ticket.issueType}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted" />
                      {new Date(ticket.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>

                    <span className="text-muted group-hover:text-foreground transition-colors flex items-center gap-1 font-medium">
                      View details
                      <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>

                {/* Content & Affected Device */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1 max-w-2xl">
                    <h3 className="text-sm font-semibold text-foreground group-hover:text-accent transition-colors">
                      {ticket.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-1">
                      {ticket.description}
                    </p>
                  </div>

                  {/* Device Tag */}
                  {ticket.itemName && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-subtle border border-border text-xs text-foreground shrink-0">
                      <Laptop className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span className="font-medium truncate max-w-[180px]">
                        {ticket.itemName}
                      </span>
                      {ticket.itemSerial && (
                        <span className="font-mono text-[11px] text-muted">
                          ({ticket.itemSerial})
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* ─── 4-Step Progress Stepper ─── */}
                <div className="pt-2">
                  <div className="grid grid-cols-4 gap-2">
                    {STAGES.map((stg) => {
                      const isComplete = currentStage > stg.step;
                      const isCurrent = currentStage === stg.step;

                      return (
                        <div key={stg.step} className="space-y-1.5">
                          {/* Progress Line Bar */}
                          <div
                            className={`h-1 rounded-full transition-colors ${
                              isComplete
                                ? "bg-emerald-500"
                                : isCurrent
                                ? "bg-amber-500 animate-pulse"
                                : "bg-border"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span
                              className={`text-[11px] font-medium leading-tight truncate ${
                                isComplete
                                  ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                                  : isCurrent
                                  ? "text-foreground font-bold"
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

                {/* Technician Notes or Resolution Preview */}
                {(ticket.assignedTechName || ticket.techNotes) && (
                  <div className="pt-1 flex items-center justify-between text-xs text-muted bg-surface-subtle border border-border rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        Assigned Tech:{" "}
                        <strong className="text-foreground font-medium">
                          {ticket.assignedTechName || "IT Specialist"}
                        </strong>
                      </span>
                    </div>

                    {ticket.techNotes && (
                      <span className="text-[11px] text-muted truncate max-w-xs italic hidden md:inline">
                        &ldquo;{ticket.techNotes}&rdquo;
                      </span>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── Ticket Details Modal ─── */}
      {selectedTicket && (
        <Modal
          isOpen={Boolean(selectedTicket)}
          onClose={() => setSelectedTicket(null)}
          title={`Ticket Details — ${selectedTicket.ticketNumber}`}
          description="Full diagnostic report and IT support resolution timeline."
          size="lg"
        >
          <div className="space-y-5 animate-fade-in text-xs">
            {/* Ticket Header & Status Pills */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface-subtle border border-border">
              <div className="space-y-0.5">
                <span className="text-[11px] text-muted font-mono">Status & Priority</span>
                <div className="flex items-center gap-2 pt-0.5">
                  <Badge
                    variant={
                      selectedTicket.status === "resolved"
                        ? "resolved"
                        : selectedTicket.status === "in-repair"
                        ? "in-repair"
                        : "submitted"
                    }
                    label={selectedTicket.status.toUpperCase()}
                  />
                  <span className="px-2 py-0.5 rounded-full border border-border bg-surface text-[11px] font-medium text-foreground uppercase">
                    {selectedTicket.priority} Priority
                  </span>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <span className="text-[11px] text-muted">Created On</span>
                <p className="font-mono text-foreground">
                  {new Date(selectedTicket.createdAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Affected Device Card */}
            {selectedTicket.itemName && (
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-foreground">
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
                <span className="text-[11px] text-muted bg-surface px-2.5 py-1 rounded-md border border-border">
                  Assigned Asset
                </span>
              </div>
            )}

            {/* Issue Description */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Summary & Defect Description
              </h4>
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-border space-y-2">
                <h5 className="text-sm font-semibold text-foreground">
                  {selectedTicket.title}
                </h5>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap text-xs">
                  {selectedTicket.description}
                </p>
              </div>
            </div>

            {/* Attachments (if any) */}
            {selectedTicket.attachmentUrls && selectedTicket.attachmentUrls.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  Photo / Evidence Attachments
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTicket.attachmentUrls.map((url, idx) => (
                    <a
                      key={idx}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-subtle border border-border hover:border-accent text-foreground hover:text-accent transition-colors"
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-muted" />
                      <span className="truncate max-w-[200px] text-xs">{url}</span>
                      <ExternalLink className="w-3 h-3 text-muted" />
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
              <div className="p-4 rounded-xl bg-surface-subtle border border-border space-y-3">
                <div className="flex items-center gap-2.5 pb-2.5 border-b border-border">
                  <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-semibold">
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
                    <p className="text-xs text-foreground bg-surface p-2.5 rounded-lg border border-border">
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
                    <p className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-500/20">
                      {selectedTicket.resolutionSummary}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 flex items-center justify-between border-t border-border">
              <button
                type="button"
                onClick={() => handleCopy(selectedTicket.ticketNumber)}
                className="flex items-center gap-1.5 text-xs text-muted hover:text-foreground transition-colors"
              >
                {copiedTicketId === selectedTicket.ticketNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>Copy Ticket ID</span>
              </button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => setSelectedTicket(null)}
              >
                Close Details
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
