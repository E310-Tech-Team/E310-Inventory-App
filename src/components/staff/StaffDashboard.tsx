"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DepartmentUser, StaffDevice, DeviceComplaint } from "@/types";
import { Card } from "@/components/common/Card";
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
    <div className="space-y-8 animate-fade-in">
      {/* ─── Clean Header & Greeting ─── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-muted mt-1">
            Overview of your assigned equipment and active IT support requests.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
          <Button
            variant="outline"
            size="lg"
            className="h-11 sm:h-12 px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-bold rounded-2xl border-border bg-surface hover:bg-surface-elevated hover:border-brand-teal/40 transition-all duration-200 active:scale-[0.98] shadow-xs"
            onClick={() => {
              setSelectedDeviceForIssue(null);
              setIsReportOpen(true);
            }}
            leftIcon={<AlertTriangle className="w-4.5 h-4.5 text-amber-500 shrink-0" />}
          >
            Report an Issue
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="h-11 sm:h-12 px-6 py-2.5 sm:px-7 sm:py-3 text-sm sm:text-base font-extrabold rounded-2xl bg-brand-yellow text-brand-navy shadow-md hover:shadow-lg hover:brightness-105 transition-all duration-200 active:scale-[0.98]"
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<Plus className="w-5 h-5 stroke-[2.5] text-brand-navy shrink-0" />}
          >
            Register Device
          </Button>
        </div>
      </div>

      {/* ─── Quick Stats Overview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border border-border bg-surface">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Assigned Equipment</p>
          <p className="text-3xl font-black text-foreground mt-2">
            {devices.length}
          </p>
        </Card>

        <Card className="p-5 border border-border bg-surface">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Active IT Tickets</p>
          <p className="text-3xl font-black text-foreground mt-2">
            {activeTickets.length}
          </p>
        </Card>

        <Card className="p-5 border border-border bg-surface">
          <p className="text-xs font-semibold text-muted uppercase tracking-wider">Department</p>
          <p className="text-base font-bold text-foreground mt-2 truncate">
            {user.department || "R4C Operations"}
          </p>
        </Card>
      </div>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Devices & Active Tickets */}
        <div className="lg:col-span-8 space-y-8">
          {/* Assigned Devices Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
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
              <Card className="py-10 px-6 text-center border-dashed border-border bg-surface space-y-3">
                <div className="mx-auto w-12 h-12 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
                  <Laptop className="w-6 h-6" />
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
              </Card>
            ) : (
              <div className="space-y-3">
                {devices.slice(0, 3).map((device) => (
                  <Card
                    key={device.checkoutId || device.itemId}
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-border bg-surface hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
                        <Laptop className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-foreground">
                            {device.name}
                          </h3>
                          <Badge variant="active" label="In Custody" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted">
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
                      className="text-xs text-muted hover:text-foreground"
                    >
                      Report issue
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Active Support Tickets Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
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
              <Card className="py-8 px-4 text-center border-dashed border-border bg-surface">
                <p className="text-xs text-muted">
                  No support tickets on file. Everything is running smoothly.
                </p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {complaints.slice(0, 4).map((ticket) => (
                  <Link key={ticket.id} href="/staff/tickets" className="block">
                    <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border border-border bg-surface hover:border-accent/40 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {ticket.ticketNumber}
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
                        <p className="text-sm font-semibold text-foreground">
                          {ticket.title}
                        </p>
                      </div>

                      <div className="text-right shrink-0 text-xs text-muted flex items-center gap-2">
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-muted" />
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): Information & Actions */}
        <div className="lg:col-span-4 space-y-6">
          {/* Support & Actions Card */}
          <Card className="space-y-4 p-5 border border-border bg-surface">
            <h3 className="text-sm font-bold text-foreground">
              IT Support & Helpdesk
            </h3>

            <div className="space-y-2 text-xs text-muted">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-muted shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">Room 310 Helpdesk</p>
                  <p>Monday – Friday, 08:00 – 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-border">
                <ShieldCheck className="w-4 h-4 text-brand-teal shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-foreground">Hardware Stewardship</p>
                  <p>Devices remain property of R4C Global. Report issues promptly.</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
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
          </Card>

          {/* IT Notices */}
          <Card className="space-y-3 p-5 border border-border bg-surface">
            <h3 className="text-sm font-bold text-foreground">
              Notice
            </h3>
            <p className="text-xs text-muted leading-relaxed">
              Standard operating system updates occur automatically over weekends. Please keep assigned devices connected to power.
            </p>
            <div className="pt-1">
              <a
                href="mailto:ezekielgoodness@r4cglobal.org"
                className="text-xs text-muted hover:text-foreground inline-flex items-center gap-1 transition-colors font-medium"
              >
                <span>Contact IT Administration</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
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
        <div className="space-y-4 text-xs text-foreground/80 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-1">
            <h4 className="font-bold text-foreground">1. Custody and Care</h4>
            <p className="text-muted">
              Assigned equipment remains the property of R4C Global and should be handled with reasonable care against loss and liquid damage.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-1">
            <h4 className="font-bold text-foreground">2. Issue Reporting</h4>
            <p className="text-muted">
              If an assigned device experiences a hardware malfunction or physical damage, file a ticket through this portal so a replacement or repair can be coordinated.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-elevated border border-border space-y-1">
            <h4 className="font-bold text-foreground">3. Return Timeline</h4>
            <p className="text-muted">
              Fixed-date loans should be returned to Room 310 by the specified due date or extended through IT support.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="secondary" size="sm" onClick={() => setIsPolicyOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
