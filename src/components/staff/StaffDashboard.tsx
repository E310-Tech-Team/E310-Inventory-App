"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { DepartmentUser, StaffDevice, DeviceComplaint } from "@/types";
import { DeviceTopologyCanvas } from "@/components/common/DeviceTopologyCanvas";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { RegisterDeviceModal } from "@/components/staff/RegisterDeviceModal";
import { ReportIssueModal } from "@/components/staff/ReportIssueModal";
import {
  Laptop,
  AlertTriangle,
  PlusCircle,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Copy,
  Check,
  Calendar,
  Sparkles,
  Bell,
  Clock,
  Radio,
  ExternalLink,
  ChevronRight,
  HardDrive,
  Wrench,
  HelpCircle,
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

  // Refresh data
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

  // Derive primary device (first active laptop or first device)
  const primaryDevice =
    devices.find((d) => d.name.toLowerCase().includes("macbook") || d.name.toLowerCase().includes("laptop")) ||
    devices[0] ||
    null;

  // Active tickets
  const activeTickets = complaints.filter(
    (c) => c.status !== "resolved" && c.status !== "closed" && c.status !== "cancelled"
  );

  // First name extraction
  const firstName = user.name?.split(" ")[0] || "Team Member";

  // Dynamic greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Live formatted current date
  const todayFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8 animate-enter">
      {/* ─── Hero Overview Cockpit with 3D Topology Canvas ─── */}
      <section className="relative overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-neutral-900/90 via-neutral-950/95 to-[#080d1a] backdrop-blur-2xl p-6 sm:p-8 lg:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.7)]">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Greeting & Status Metrics */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-neutral-800/80 text-neutral-300 border border-neutral-700/60 shadow-sm">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{todayFormatted}</span>
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>Network Active</span>
              </span>
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
                {getGreeting()}, {firstName} 👋
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 max-w-xl leading-relaxed">
                Welcome to your self-service hardware command portal. Manage company equipment custody, log priority IT support requests, and track open service tickets.
              </p>
            </div>

            {/* Quick Metrics Bar */}
            <div className="pt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-neutral-950/50 border border-white/[0.06] backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Assigned Hardware
                </span>
                <p className="text-xl font-bold font-mono text-white mt-0.5">
                  {devices.length}
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-neutral-950/50 border border-white/[0.06] backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Open Tickets
                </span>
                <p className={`text-xl font-bold font-mono mt-0.5 ${activeTickets.length > 0 ? "text-amber-400" : "text-emerald-400"}`}>
                  {activeTickets.length}
                </p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-neutral-950/50 border border-white/[0.06] backdrop-blur-md">
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                  Department
                </span>
                <p className="text-xs font-semibold text-neutral-200 mt-1 truncate">
                  {user.department || "R4C Operations"}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Three.js Interactive 3D Topology Mesh */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative min-h-[240px] sm:min-h-[280px]">
            <div className="absolute inset-0 flex items-center justify-center">
              <DeviceTopologyCanvas
                className="w-full h-full max-h-[280px]"
                activeStatus={activeTickets.length > 0 ? "busy" : "healthy"}
              />
            </div>
            <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded-full bg-neutral-950/70 border border-white/[0.08] backdrop-blur-md text-[10px] font-mono text-neutral-400 pointer-events-none">
              E310 3D Topology Mesh
            </div>
          </div>
        </div>
      </section>

      {/* ─── Main Content Grid: Primary Device & Quick Action Decks ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Primary Device Spotlight + Active Tickets */}
        <div className="lg:col-span-8 space-y-6">
          {/* "My Primary Device" Spotlight Card (Issue #14 & #16) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-300">
                  Primary Issued Workstation
                </h2>
              </div>
              <Link
                href="/staff/devices"
                className="text-xs font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 group"
              >
                <span>View all {devices.length} devices</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {primaryDevice ? (
              <Card className="relative overflow-hidden group">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
                  <div className="flex items-center gap-3.5">
                    <div className="h-12 w-12 rounded-2xl bg-neutral-800/90 border border-white/[0.08] flex items-center justify-center text-emerald-400 shadow-sm group-hover:scale-105 transition-transform">
                      <Laptop className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                          {primaryDevice.categoryName}
                        </span>
                        <span className="text-neutral-600">•</span>
                        <span className="text-[11px] font-mono text-neutral-400 capitalize">
                          Condition: {primaryDevice.condition}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {primaryDevice.name}
                      </h3>
                    </div>
                  </div>

                  <Badge variant="active" label="IN CUSTODY" />
                </div>

                {/* Specs and Hardware Identifiers */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-white/[0.05]">
                    <span className="text-[11px] font-mono text-neutral-400">SERIAL NUMBER</span>
                    <button
                      onClick={() => copyToClipboard(primaryDevice.serialNumber || "N/A")}
                      className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors pressable"
                      title="Click to copy serial"
                    >
                      <span>{primaryDevice.serialNumber || "UNTAGGED"}</span>
                      {copiedSerial === primaryDevice.serialNumber ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-500" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/40 border border-white/[0.05]">
                    <span className="text-[11px] font-mono text-neutral-400">ISSUED DATE</span>
                    <span className="font-mono text-xs text-neutral-200">
                      {new Date(primaryDevice.dateCollected).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

                {/* Active Complaint alert if linked */}
                {primaryDevice.activeComplaint && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                    <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                          {primaryDevice.activeComplaint.ticketNumber} • {primaryDevice.activeComplaint.status}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-400 capitalize">
                          {primaryDevice.activeComplaint.priority} Priority
                        </span>
                      </div>
                      <p className="text-xs text-neutral-200 truncate mt-0.5">
                        {primaryDevice.activeComplaint.title}
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Bar */}
                <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Hardware Warranty Active</span>
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    onClick={() => {
                      setSelectedDeviceForIssue(primaryDevice);
                      setIsReportOpen(true);
                    }}
                  >
                    Report Hardware Issue
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="text-center py-8 px-6 flex flex-col items-center justify-center space-y-3">
                <div className="h-12 w-12 rounded-xl bg-neutral-800/80 border border-white/[0.08] flex items-center justify-center text-neutral-400">
                  <Laptop className="w-6 h-6 text-neutral-500" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-white">No Primary Workstation Linked</h3>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    Self-register your work laptop to monitor custody status and receive automated warranty support.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<PlusCircle className="w-4 h-4" />}
                  onClick={() => setIsRegisterOpen(true)}
                >
                  Register Workstation
                </Button>
              </Card>
            )}
          </section>

          {/* Active Support Tickets Tracker (Issue #21) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-300">
                  Active Service Tickets
                </h2>
              </div>
              <span className="text-xs font-mono text-neutral-400">
                {activeTickets.length} active {activeTickets.length === 1 ? "case" : "cases"}
              </span>
            </div>

            {activeTickets.length === 0 ? (
              <Card className="py-6 px-5 flex items-center justify-between bg-neutral-900/40">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Check className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">All Systems Operational</h4>
                    <p className="text-[11px] text-neutral-400">
                      No outstanding hardware issues or repair tickets logged for your account.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedDeviceForIssue(null);
                    setIsReportOpen(true);
                  }}
                  className="text-xs text-neutral-400 hover:text-white"
                >
                  Log a Problem
                </Button>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {activeTickets.map((ticket) => (
                  <Card key={ticket.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-400">
                          {ticket.ticketNumber}
                        </span>
                        <span className="text-neutral-600">•</span>
                        <Badge
                          variant={
                            ticket.status === "in-repair"
                              ? "in-repair"
                              : ticket.status === "under-review"
                              ? "under-review"
                              : "submitted"
                          }
                          label={ticket.status.toUpperCase()}
                        />
                      </div>
                      <h4 className="text-sm font-semibold text-white">
                        {ticket.title}
                      </h4>
                      <p className="text-xs text-neutral-400 line-clamp-1">
                        {ticket.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono text-neutral-400 block">
                        Priority: <span className="text-amber-400 capitalize">{ticket.priority}</span>
                      </span>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column (4 cols): Quick Action Decks + IT Bulletin */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Action Decks (Issue #14) */}
          <section className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-300">
              Quick Port Actions
            </h2>

            <div className="space-y-2.5">
              {/* Report Problem Card */}
              <button
                onClick={() => {
                  setSelectedDeviceForIssue(null);
                  setIsReportOpen(true);
                }}
                className="w-full text-left p-4 rounded-2xl border border-white/[0.08] bg-neutral-900/60 hover:bg-neutral-850 hover:border-amber-500/30 transition-all duration-200 group pressable flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Report a Problem</h3>
                    <p className="text-[11px] text-neutral-400">Hardware fault, battery, or screen</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Register Device Card */}
              <button
                onClick={() => setIsRegisterOpen(true)}
                className="w-full text-left p-4 rounded-2xl border border-white/[0.08] bg-neutral-900/60 hover:bg-neutral-850 hover:border-emerald-500/30 transition-all duration-200 group pressable flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                    <PlusCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Register New Device</h3>
                    <p className="text-[11px] text-neutral-400">Self-register personal or work gear</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
              </button>

              {/* Equipment Policy Card */}
              <button
                onClick={() => setIsPolicyOpen(true)}
                className="w-full text-left p-4 rounded-2xl border border-white/[0.08] bg-neutral-900/60 hover:bg-neutral-850 hover:border-sky-500/30 transition-all duration-200 group pressable flex items-center justify-between shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Equipment Policy</h3>
                    <p className="text-[11px] text-neutral-400">Custody care & security guidelines</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </section>

          {/* IT Bulletin & Announcement Widget (Issue #14) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-neutral-300">
                  IT Bulletin
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVE
              </span>
            </div>

            <Card className="space-y-4 p-5">
              <div className="space-y-2 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>MAINTENANCE WINDOW</span>
                  <span className="text-sky-400">Fri 22:00 UTC</span>
                </div>
                <h4 className="text-xs font-semibold text-white">
                  Scheduled OS & Security Patch Window
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Automatic endpoint security updates will install during the weekend. Please keep devices plugged in.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                  <span>HARDWARE RETURN DESK</span>
                  <span className="text-emerald-400">Room 310</span>
                </div>
                <h4 className="text-xs font-semibold text-white">
                  Physical Helpdesk Hours
                </h4>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  The E310 IT lab is open Monday through Friday from 08:00 to 18:00 for equipment drop-offs and screen repairs.
                </p>
              </div>

              <div className="pt-2 text-center">
                <a
                  href="mailto:ezekielgoodness@r4cglobal.org"
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                >
                  <span>Contact IT Lead Directly</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </Card>
          </section>
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

      {/* Equipment Policy Modal */}
      <Modal
        isOpen={isPolicyOpen}
        onClose={() => setIsPolicyOpen(false)}
        title="R4C Global Equipment Custody Policy"
        description="Official guidelines for hardware stewardship, return windows, and security standards."
        size="lg"
      >
        <div className="space-y-4 text-xs text-neutral-300 leading-relaxed">
          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/[0.06] space-y-1">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>1. Custody & Stewardship</span>
            </h4>
            <p className="text-neutral-400">
              All devices assigned through the E310 portal remain the property of R4C Global. Staff members are responsible for safeguarding hardware against physical loss, theft, and liquid damage.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/[0.06] space-y-1">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>2. Incident & Loss Reporting</span>
            </h4>
            <p className="text-neutral-400">
              In the event of hardware malfunction, battery expansion, or accidental damage, a ticket must be filed via this portal within 24 hours so IT can issue a loaner device.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-neutral-950/60 border border-white/[0.06] space-y-1">
            <h4 className="font-semibold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-sky-400" />
              <span>3. Return Timeline</span>
            </h4>
            <p className="text-neutral-400">
              Fixed-date items must be returned to Room 310 on or before the due date indicated on your dashboard. Extension requests can be submitted to IT support.
            </p>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setIsPolicyOpen(false)}>
              Understood
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
