"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DepartmentUser, StaffDevice, DeviceComplaint } from "@/types";
import { subscribeToTicketUpdates } from "@/lib/sync/ticket-broadcast";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { RegisterDeviceModal } from "@/components/staff/RegisterDeviceModal";
import { ReportIssueModal } from "@/components/staff/ReportIssueModal";
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

  // Modals
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isPolicyOpen, setIsPolicyOpen] = useState(false);
  const [selectedDeviceForIssue, setSelectedDeviceForIssue] = useState<StaffDevice | null>(null);

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

  const activeTickets = complaints.filter(
    (c) => c.status !== "resolved" && c.status !== "closed" && c.status !== "cancelled"
  );

  const firstName = user.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* ─── Clean Header & Greeting ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-border/60">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome, {firstName}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">
            Overview of your assigned equipment and active IT support requests.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
          <Button
            variant="outline"
            size="md"
            className="justify-center"
            onClick={() => {
              setSelectedDeviceForIssue(null);
              setIsReportOpen(true);
            }}
            leftIcon={<AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
          >
            Report Issue
          </Button>
          <Button
            variant="primary"
            size="md"
            className="justify-center"
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<Plus className="w-4 h-4 shrink-0" />}
          >
            Register Device
          </Button>
        </div>
      </div>

      {/* ─── Quick Stats Overview ─── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] sm:text-xs font-medium text-muted truncate">
            <span className="sm:hidden">Devices</span>
            <span className="hidden sm:inline">Assigned Equipment</span>
          </p>
          <p className="text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums mt-1 sm:mt-2">
            {devices.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
          <p className="text-[11px] sm:text-xs font-medium text-muted truncate">
            <span className="sm:hidden">Active Tickets</span>
            <span className="hidden sm:inline">Active IT Tickets</span>
          </p>
          <p className="text-xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums mt-1 sm:mt-2">
            {activeTickets.length}
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-surface p-3 sm:p-5 shadow-[0_1px_4px_rgba(0,0,0,0.02)] min-w-0">
          <p className="text-[11px] sm:text-xs font-medium text-muted truncate">Department</p>
          <p className="text-xs sm:text-base font-semibold text-foreground mt-1.5 sm:mt-2.5 truncate">
            {user.department || "R4C Operations"}
          </p>
        </div>
      </div>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column (8 cols): Devices & Active Tickets */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-6">
          {/* Assigned Devices Section */}
          <section className="rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-border/60">
              <h2 className="text-sm font-semibold text-foreground">
                Assigned Devices
              </h2>
              {devices.length > 0 && (
                <Link
                  href="/staff/devices"
                  className="text-xs text-muted hover:text-foreground flex items-center gap-1 transition-colors font-medium"
                >
                  <span>View all ({devices.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {devices.length === 0 ? (
              <div className="py-8 sm:py-10 px-4 sm:px-6 text-center space-y-3">
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
                {devices.slice(0, 3).map((device, idx) => (
                  <div
                    key={device.checkoutId || device.itemId}
                    className={`${
                      idx >= 2 ? "hidden sm:flex" : "flex"
                    } px-3.5 sm:px-5 py-3 sm:py-4 flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 hover:bg-surface-elevated/40 transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {device.name}
                          </h3>
                          <Badge variant="active" label="In Custody" />
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1 text-xs text-muted">
                          <span>Serial:</span>
                          <button
                            onClick={() => copyToClipboard(device.serialNumber || "N/A")}
                            className="font-mono text-foreground hover:text-accent flex items-center gap-1 transition-colors font-medium"
                            title="Click to copy serial"
                          >
                            <span>{device.serialNumber || "None"}</span>
                            {copiedSerial === device.serialNumber ? (
                              <Check className="w-3.5 h-3.5 text-status-available" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedDeviceForIssue(device);
                        setIsReportOpen(true);
                      }}
                      className="text-xs text-muted hover:text-foreground shrink-0 self-end sm:self-auto"
                    >
                      Report issue
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Active Support Tickets Section */}
          <section className="rounded-2xl border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] overflow-hidden">
            <div className="flex items-center justify-between px-3.5 sm:px-5 py-3 sm:py-4 border-b border-border/60">
              <h2 className="text-sm font-semibold text-foreground">
                Recent Support Requests
              </h2>
              <Link
                href="/staff/tickets"
                className="text-xs text-muted hover:text-foreground transition-colors flex items-center gap-1 font-medium"
              >
                <span>View all tickets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {complaints.length === 0 ? (
              <div className="py-8 sm:py-10 px-4 sm:px-6 text-center">
                <p className="text-xs text-muted">
                  No support tickets on file. Everything is running smoothly.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {complaints.slice(0, 4).map((rawTicket, idx) => {
                  const ticket = rawTicket as DeviceComplaint & {
                    ticket_number?: string;
                    created_at?: string;
                  };
                  const dateVal = ticket.createdAt || ticket.created_at;
                  let formattedDate = "Recently";
                  if (dateVal) {
                    const parsed = new Date(dateVal);
                    if (!isNaN(parsed.getTime())) {
                      formattedDate = parsed.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    }
                  }
                  const ticketNum = ticket.ticketNumber || ticket.ticket_number || "TKT";

                  return (
                    <Link
                      key={ticket.id}
                      href="/staff/tickets"
                      className={`${
                        idx >= 3 ? "hidden sm:flex" : "flex"
                      } px-3.5 sm:px-5 py-3 sm:py-4 flex-row items-center justify-between gap-3 hover:bg-surface-elevated/40 transition-colors`}
                    >
                      <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-semibold text-muted tabular-nums">
                            {ticketNum}
                          </span>
                          <Badge
                            variant={
                              ticket.status === "resolved"
                                ? "resolved"
                                : ticket.status === "in-repair"
                                ? "in-repair"
                                : "submitted"
                            }
                            label={ticket.status}
                          />
                        </div>
                        <p className="text-sm font-medium text-foreground truncate">
                          {ticket.title}
                        </p>
                      </div>

                      <div className="text-right shrink-0 text-xs text-muted flex items-center gap-1.5 sm:gap-2 tabular-nums">
                        <span>{formattedDate}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): Information & Actions */}
        <div className="lg:col-span-4 space-y-4 sm:space-y-5">
          {/* Support & Actions Card */}
          <div className="rounded-2xl border border-border/70 bg-surface p-4 sm:p-5 space-y-3 sm:space-y-4 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-semibold text-foreground">
              IT Support &amp; Helpdesk
            </h3>

            <div className="space-y-2.5 sm:space-y-3 text-xs text-muted">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Room 310 Helpdesk</p>
                  <p className="mt-0.5">Monday – Friday, 08:00 – 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 pt-2.5 sm:pt-3 border-t border-border/50">
                <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground">Hardware Stewardship</p>
                  <p className="mt-0.5">Devices remain property of R4C Global. Report issues promptly.</p>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-between"
                onClick={() => setIsPolicyOpen(true)}
                rightIcon={<ChevronRight className="w-3.5 h-3.5 text-muted" />}
              >
                View Equipment Guidelines
              </Button>
            </div>
          </div>

          {/* IT Notices */}
          <div className="rounded-2xl border border-border/70 bg-surface p-4 sm:p-5 space-y-2 sm:space-y-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
            <h3 className="text-sm font-semibold text-foreground">
              Notice
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Standard operating system updates occur automatically over weekends. Please keep assigned devices connected to power.
            </p>
            <div className="pt-1">
              <a
                href="mailto:ezekielgoodness@r4cglobal.org"
                className="text-xs text-accent hover:text-accent-hover inline-flex items-center gap-1 transition-colors font-medium"
              >
                <span>Contact IT Administration</span>
                <ExternalLink className="w-3.5 h-3.5" />
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

      <Modal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        title="Equipment Policy Guidelines"
        description="Standard operating guidelines for company hardware custody."
        size="md"
      >
        <div className="space-y-3.5 text-xs text-foreground/80 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-surface-elevated/45 border border-border/60 space-y-1">
            <h4 className="font-semibold text-foreground">1. Custody and Care</h4>
            <p className="text-muted">
              Assigned equipment remains the property of R4C Global and should be handled with reasonable care against loss and liquid damage.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated/45 border border-border/60 space-y-1">
            <h4 className="font-semibold text-foreground">2. Issue Reporting</h4>
            <p className="text-muted">
              If an assigned device experiences a hardware malfunction or physical damage, file a ticket through this portal so a replacement or repair can be coordinated.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated/45 border border-border/60 space-y-1">
            <h4 className="font-semibold text-foreground">3. Return Timeline</h4>
            <p className="text-muted">
              Fixed-date loans should be returned to Room 310 by the specified due date or extended through IT support.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setIsPolicyOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
