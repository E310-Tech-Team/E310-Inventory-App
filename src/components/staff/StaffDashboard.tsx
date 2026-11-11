"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DepartmentUser, StaffDevice, DeviceComplaint } from "@/types";
import { subscribeToTicketUpdates } from "@/lib/sync/ticket-broadcast";
import { Badge } from "@/components/common/Badge";
import { formatDate, formatCompactDateTime, formatDateTime } from "@/lib/format-date";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { RegisterDeviceModal } from "@/components/staff/RegisterDeviceModal";
import { ReportIssueModal } from "@/components/staff/ReportIssueModal";
import {
  DeleteDeviceModal,
  getRegistrationBadgeMeta,
} from "@/components/staff/DeleteDeviceModal";
import {
  Laptop,
  AlertTriangle,
  Plus,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  ChevronRight,
  Clock,
  LifeBuoy,
  Building2,
  CheckCircle2,
  Calendar,
  Trash2,
} from "lucide-react";

interface StaffDashboardProps {
  user: DepartmentUser;
  initialDevices: StaffDevice[];
  initialComplaints: DeviceComplaint[];
}

export function StaffDashboard({
  user,
  initialDevices,
  initialComplaints,
}: StaffDashboardProps) {
  const [devices, setDevices] = useState<StaffDevice[]>(initialDevices);
  const [complaints, setComplaints] = useState<DeviceComplaint[]>(initialComplaints);
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [ticketTab, setTicketTab] = useState<"active" | "resolved">("active");

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [selectedDeviceForIssue, setSelectedDeviceForIssue] = useState<StaffDevice | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<StaffDevice | null>(null);

  const refreshData = async () => {
    try {
      const [devRes, compRes] = await Promise.all([
        fetch("/api/staff/devices"),
        fetch("/api/staff/complaints"),
      ]);
      if (devRes.ok) {
        const devData = await devRes.json();
        setDevices(devData.devices || []);
      }
      if (compRes.ok) {
        const compData = await compRes.json();
        setComplaints(compData.complaints || []);
      }
    } catch (err) {
      console.warn("Failed to refresh staff dashboard data:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeToTicketUpdates(() => {
      refreshData();
    });
    return () => unsubscribe();
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSerial(text);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const isClosedStatus = (status: string) =>
    status === "resolved" || status === "closed" || status === "cancelled";

  const activeTickets = complaints.filter((c) => !isClosedStatus(c.status));
  const resolvedTickets = complaints.filter((c) => isClosedStatus(c.status));
  const displayedTickets = (ticketTab === "active" ? activeTickets : resolvedTickets).slice(0, 4);

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* ─── Header & Primary Actions ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-5 border-b border-border/60">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground truncate">
            Welcome, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">
            Monitor assigned hardware in your custody and track active IT requests.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          <Button
            variant="outline"
            size="md"
            className="justify-center whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
            onClick={() => {
              setSelectedDeviceForIssue(null);
              setIsReportOpen(true);
            }}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />}
          >
            Report Issue
          </Button>
          <Button
            variant="primary"
            size="md"
            className="justify-center whitespace-nowrap text-xs sm:text-sm px-3 sm:px-4"
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />}
          >
            Register Device
          </Button>
        </div>
      </div>

      {/* ─── Balanced KPI Summary Strip ─── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
        {/* Card 1: Assigned Equipment */}
        <div className="rounded-2xl border border-brand-teal/40 bg-brand-teal/[0.04] dark:bg-brand-teal/[0.07] p-3 sm:p-5 flex flex-col justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-2">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-brand-teal/15 text-brand-teal flex items-center justify-center shrink-0">
              <Laptop className="w-4 h-4" />
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium bg-brand-teal/12 text-brand-teal border border-brand-teal/25 whitespace-nowrap">
              {devices.length > 0 ? "In Custody" : "Empty"}
            </span>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <p className="text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums leading-none">
              {devices.length}
            </p>
            <p className="text-[11px] sm:text-xs font-semibold text-foreground mt-1.5 sm:mt-2 truncate">
              <span className="sm:hidden">Assigned Devices</span>
              <span className="hidden sm:inline">Assigned Equipment</span>
            </p>
            <p className="hidden sm:block text-[11px] text-muted mt-0.5 truncate">
              Active hardware checked out to you
            </p>
          </div>
        </div>

        {/* Card 2: Active IT Tickets */}
        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 flex flex-col justify-between shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center justify-between gap-2">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                activeTickets.length > 0
                  ? "bg-amber-500/12 text-amber-600 dark:text-amber-400"
                  : "bg-emerald-500/12 text-emerald-600 dark:text-emerald-400"
              }`}
            >
              <LifeBuoy className="w-4 h-4" />
            </div>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-medium border whitespace-nowrap ${
                activeTickets.length > 0
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                  : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
              }`}
            >
              {activeTickets.length > 0 ? "Open" : "All Clear"}
            </span>
          </div>
          <div className="mt-2.5 sm:mt-4">
            <p className="text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums leading-none">
              {activeTickets.length}
            </p>
            <p className="text-[11px] sm:text-xs font-semibold text-foreground mt-1.5 sm:mt-2 truncate">
              Active IT Tickets
            </p>
            <p className="hidden sm:block text-[11px] text-muted mt-0.5 truncate">
              {activeTickets.length > 0 ? "Undergoing triage or repair" : "No open support requests"}
            </p>
          </div>
        </div>

        {/* Card 3: Department / Team */}
        <div className="col-span-2 sm:col-span-1 rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 flex flex-row sm:flex-col items-center sm:items-stretch justify-between gap-3 min-w-0 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-2.5 sm:justify-between min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface-elevated border border-border/70 text-foreground-muted flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="sm:hidden min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                Department
              </p>
              <p className="text-xs font-bold tracking-tight text-foreground truncate">
                {user.department || "R4C Operations"}
              </p>
            </div>
            {user.staffId && (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-surface-elevated text-muted border border-border/70">
                {user.staffId}
              </span>
            )}
          </div>

          {user.staffId && (
            <span className="sm:hidden shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-surface-elevated text-muted border border-border/70">
              {user.staffId}
            </span>
          )}

          <div className="hidden sm:block mt-4 min-w-0">
            <p className="text-lg font-bold tracking-tight text-foreground truncate leading-snug">
              {user.department || "R4C Operations"}
            </p>
            <p className="text-xs font-semibold text-foreground mt-2 truncate">
              Department
            </p>
            <p className="text-[11px] text-muted mt-0.5 truncate">
              Primary organizational team
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Two-Column Content ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column (8 cols): Devices & Tickets */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6 min-w-0">
          {/* Assigned Devices Section */}
          <section className="rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-border/60">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-foreground">
                  Assigned Devices
                </h2>
                <span className="text-[11px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-surface-elevated text-muted border border-border/70">
                  {devices.length}
                </span>
              </div>
              {devices.length > 0 && (
                <Link
                  href="/staff/devices"
                  className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 transition-colors font-medium shrink-0"
                >
                  <span>View all</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {devices.length === 0 ? (
              <div className="py-7 sm:py-10 px-4 sm:px-6 text-center space-y-3">
                <div className="mx-auto w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    No devices currently assigned
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    If you have received an office laptop, phone, or accessory, you can link it to your account.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRegisterOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Register Device
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {devices.slice(0, 3).map((device, idx) => {
                  const assignedDate = formatDate(device.dateCollected, "") || null;
                  const dueDate = formatDate(device.dueDate, "") || null;
                  const isOverdue = device.status === "overdue";
                  const registrationBadge = getRegistrationBadgeMeta(device);

                  return (
                    <div
                      key={device.checkoutId || device.itemId}
                      className={`${
                        idx >= 2 ? "hidden sm:flex" : "flex"
                      } px-3.5 sm:px-5 py-3 sm:py-4 flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 hover:bg-surface-elevated/40 transition-colors`}
                    >
                      <div className="flex items-start sm:items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0 mt-0.5 sm:mt-0">
                          <Laptop className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              href="/staff/devices"
                              className="text-sm font-semibold text-foreground hover:text-brand-teal transition-colors truncate max-w-full"
                            >
                              {device.name}
                            </Link>
                            <Badge
                              variant={isOverdue ? "overdue" : "active"}
                              label={isOverdue ? "Overdue" : "In Custody"}
                            />
                            {registrationBadge && (
                              <Badge
                                variant={registrationBadge.variant}
                                label={registrationBadge.label}
                              />
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-muted min-w-0">
                            {device.categoryName && (
                              <span className="truncate max-w-[140px] sm:max-w-none">{device.categoryName}</span>
                            )}
                            <button
                              type="button"
                              onClick={() => copyToClipboard(device.serialNumber || "N/A")}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-elevated/70 border border-border/60 font-mono text-[11px] text-foreground hover:border-brand-teal/40 hover:text-brand-teal transition-colors max-w-full min-w-0"
                              title="Click to copy serial number"
                            >
                              <span className="truncate">{device.serialNumber || "No serial"}</span>
                              {copiedSerial === device.serialNumber ? (
                                <Check className="w-3 h-3 text-status-available shrink-0" />
                              ) : (
                                <Copy className="w-3 h-3 text-muted shrink-0" />
                              )}
                            </button>
                            {assignedDate && (
                              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] tabular-nums">
                                <Calendar className="w-3 h-3 text-muted/70" />
                                <span>Since {assignedDate}</span>
                              </span>
                            )}
                            {dueDate && (
                              <span
                                className={`inline-flex items-center text-[11px] tabular-nums font-medium ${
                                  isOverdue ? "text-rose-500" : "text-muted"
                                }`}
                              >
                                Due {dueDate}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-0.5 sm:pt-0 shrink-0">
                        {assignedDate && (
                          <span className="sm:hidden inline-flex items-center gap-1 text-[11px] text-muted tabular-nums">
                            <Calendar className="w-3 h-3 text-muted/70" />
                            <span>Since {assignedDate}</span>
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                          {device.registeredByStaff && (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => setDeviceToDelete(device)}
                              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                              aria-label={`Delete ${device.name}`}
                              title="Delete registered device"
                              className="shrink-0 text-xs whitespace-nowrap"
                            >
                              Delete
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedDeviceForIssue(device);
                              setIsReportOpen(true);
                            }}
                            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                            className="shrink-0 text-xs whitespace-nowrap"
                          >
                            Report Issue
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Support Requests Section */}
          <section className="rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-border/60">
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <h2 className="text-sm font-semibold text-foreground">
                  Support Requests
                </h2>
                <Link
                  href="/staff/tickets"
                  className="sm:hidden text-xs text-muted hover:text-foreground transition-colors inline-flex items-center gap-1 font-medium shrink-0"
                >
                  <span>View tracker</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
                <div className="hidden sm:inline-flex rounded-lg bg-surface-elevated/70 p-0.5 border border-border/70">
                  <button
                    type="button"
                    onClick={() => setTicketTab("active")}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors tabular-nums ${
                      ticketTab === "active"
                        ? "bg-surface text-foreground shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Open ({activeTickets.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTicketTab("resolved")}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors tabular-nums ${
                      ticketTab === "resolved"
                        ? "bg-surface text-foreground shadow-2xs"
                        : "text-muted hover:text-foreground"
                    }`}
                  >
                    Resolved ({resolvedTickets.length})
                  </button>
                </div>
              </div>

              {/* Mobile Segmented Toggle */}
              <div className="sm:hidden grid grid-cols-2 rounded-lg bg-surface-elevated/70 p-0.5 border border-border/70">
                <button
                  type="button"
                  onClick={() => setTicketTab("active")}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-colors tabular-nums ${
                    ticketTab === "active"
                      ? "bg-surface text-foreground shadow-2xs font-semibold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Open ({activeTickets.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTicketTab("resolved")}
                  className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition-colors tabular-nums ${
                    ticketTab === "resolved"
                      ? "bg-surface text-foreground shadow-2xs font-semibold"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  Resolved ({resolvedTickets.length})
                </button>
              </div>

              <Link
                href="/staff/tickets"
                className="hidden sm:inline-flex text-xs text-muted hover:text-foreground transition-colors items-center gap-1 font-medium shrink-0"
              >
                <span>View tracker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {displayedTickets.length === 0 ? (
              <div className="py-7 sm:py-10 px-4 sm:px-6 text-center space-y-2.5">
                <div className="mx-auto w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-foreground">
                    {ticketTab === "active"
                      ? "No open support requests"
                      : "No resolved tickets yet"}
                  </p>
                  <p className="text-xs text-muted max-w-sm mx-auto">
                    {ticketTab === "active"
                      ? "All your equipment is running smoothly. File a ticket anytime if an issue comes up."
                      : "Completed and resolved IT requests will appear here for reference."}
                  </p>
                </div>
                <div className="pt-1 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                  {ticketTab === "active" && resolvedTickets.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTicketTab("resolved")}
                      className="text-xs font-medium text-brand-teal hover:underline"
                    >
                      View {resolvedTickets.length} resolved{" "}
                      {resolvedTickets.length === 1 ? "request" : "requests"}
                    </button>
                  )}
                  {ticketTab === "active" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDeviceForIssue(null);
                        setIsReportOpen(true);
                      }}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                    >
                      File Request
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {displayedTickets.map((rawTicket, idx) => {
                  const ticket = rawTicket as DeviceComplaint & {
                    ticket_number?: string;
                    created_at?: string;
                    resolved_at?: string | null;
                  };
                  const createdAt = ticket.createdAt || ticket.created_at;
                  const resolvedAt = ticket.resolvedAt || ticket.resolved_at;
                  const isResolved =
                    ticket.status === "resolved" || ticket.status === "closed";
                  const createdLabel = formatCompactDateTime(createdAt, "Recently");
                  const resolvedLabel = resolvedAt
                    ? formatCompactDateTime(resolvedAt, "")
                    : "";
                  const timestampTooltip = [
                    createdAt ? `Created: ${formatDateTime(createdAt)}` : null,
                    resolvedAt ? `Resolved: ${formatDateTime(resolvedAt)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ");
                  const ticketNum = ticket.ticketNumber || ticket.ticket_number || "TKT";

                  return (
                    <Link
                      key={ticket.id}
                      href="/staff/tickets"
                      className={`${
                        idx >= 3 ? "hidden sm:flex" : "flex"
                      } px-3.5 sm:px-5 py-3 sm:py-3.5 flex-row items-center justify-between gap-2.5 sm:gap-3 hover:bg-surface-elevated/40 transition-colors group`}
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-muted tabular-nums">
                            {ticketNum}
                          </span>
                          <Badge
                            variant={
                              isResolved
                                ? "resolved"
                                : ticket.status === "in-repair"
                                ? "in-repair"
                                : ticket.status === "under-review"
                                ? "under-review"
                                : "submitted"
                            }
                            label={ticket.status.replace("-", " ")}
                          />
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-brand-teal transition-colors truncate">
                          {ticket.title}
                        </p>
                      </div>

                      <div
                        title={timestampTooltip || undefined}
                        className="text-right shrink-0 text-[11px] sm:text-xs text-muted flex items-center gap-1.5 sm:gap-2 tabular-nums"
                      >
                        <div className="flex flex-col items-end leading-tight">
                          <span className="whitespace-nowrap">
                            {isResolved && resolvedLabel
                              ? `Resolved ${resolvedLabel}`
                              : createdLabel}
                          </span>
                          {isResolved && resolvedLabel && (
                            <span className="text-[10px] text-muted/75 whitespace-nowrap">
                              Created {createdLabel}
                            </span>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): Helpdesk & Guidelines */}
        <div className="lg:col-span-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3.5 sm:gap-5 min-w-0">
          {/* IT Support & Helpdesk Card */}
          <div className="rounded-2xl border border-border/70 bg-surface p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                IT Support &amp; Helpdesk
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Active Desk
              </span>
            </div>

            <div className="space-y-3 text-xs text-muted">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-surface-elevated border border-border/60 flex items-center justify-center text-foreground-muted shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Room 310 Helpdesk</p>
                  <p className="mt-0.5">Monday – Friday, 08:00 – 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-3 border-t border-border/50">
                <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center text-accent shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">Hardware Stewardship</p>
                  <p className="mt-0.5 leading-relaxed">
                    Devices remain property of R4C Global. Report defects promptly.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPolicyOpen(true)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-border/70 bg-surface-elevated/45 hover:bg-surface-elevated text-xs font-medium text-foreground transition-colors cursor-pointer"
            >
              <span>View Equipment Guidelines</span>
              <ChevronRight className="w-3.5 h-3.5 text-muted" />
            </button>
          </div>

          {/* Maintenance Notice */}
          <div className="rounded-2xl border border-border/70 bg-surface p-3.5 sm:p-5 space-y-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Notice</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-elevated text-muted border border-border/60 shrink-0">
                  Weekend Sync
                </span>
              </div>
              <p className="text-xs text-muted leading-relaxed">
                Standard operating system updates occur automatically over weekends. Keep assigned devices plugged into power.
              </p>
            </div>
            <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border/50 mt-2">
              <Link
                href="/staff/tickets"
                className="text-xs text-foreground-muted hover:text-foreground inline-flex items-center gap-1 transition-colors font-medium"
              >
                <span>Open Tracker</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <a
                href="mailto:ezekielgoodness@r4cglobal.org"
                className="text-xs text-accent hover:text-accent-hover inline-flex items-center gap-1 transition-colors font-medium"
              >
                <span>Contact IT Admin</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modals ─── */}
      <RegisterDeviceModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={refreshData}
      />

      <ReportIssueModal
        isOpen={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setSelectedDeviceForIssue(null);
        }}
        devices={devices}
        preselectedDevice={selectedDeviceForIssue}
        onSuccess={refreshData}
      />

      <DeleteDeviceModal
        device={deviceToDelete}
        onClose={() => setDeviceToDelete(null)}
        onSuccess={refreshData}
      />

      <Modal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        title="Equipment Policy Guidelines"
        description="Standard operating guidelines for company hardware custody."
        size="md"
      >
        <div className="space-y-3 text-xs text-foreground/80 leading-relaxed">
          <div className="p-3 sm:p-3.5 rounded-xl bg-surface-elevated/45 border border-border/60 space-y-1">
            <h4 className="font-semibold text-foreground">1. Custody and Care</h4>
            <p className="text-muted">
              Assigned equipment remains the property of R4C Global and should be handled with reasonable care against loss and liquid damage.
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-surface-elevated/45 border border-border/60 space-y-1">
            <h4 className="font-semibold text-foreground">2. Issue Reporting</h4>
            <p className="text-muted">
              If an assigned device experiences a hardware malfunction or physical damage, file a ticket through this portal so a replacement or repair can be coordinated.
            </p>
          </div>

          <div className="p-3 sm:p-3.5 rounded-xl bg-surface-elevated/45 border border-border/60 space-y-1">
            <h4 className="font-semibold text-foreground">3. Return Timeline</h4>
            <p className="text-muted">
              Fixed-date loans should be returned to Room 310 by the specified due date or extended through IT support.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto justify-center"
              onClick={() => setIsPolicyOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
