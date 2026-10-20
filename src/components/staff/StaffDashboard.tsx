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
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-zinc-800/80">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
            Welcome, {firstName}
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Overview of your assigned equipment and active IT support requests.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedDeviceForIssue(null);
              setIsReportOpen(true);
            }}
            leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />}
          >
            Report an Issue
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsRegisterOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Register Device
          </Button>
        </div>
      </div>

      {/* ─── Quick Stats Overview ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-zinc-400">Assigned Equipment</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-1">
            {devices.length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-zinc-400">Active IT Tickets</p>
          <p className="text-2xl font-semibold text-zinc-100 mt-1">
            {activeTickets.length}
          </p>
        </Card>

        <Card className="p-4">
          <p className="text-xs text-zinc-400">Department</p>
          <p className="text-sm font-medium text-zinc-200 mt-2 truncate">
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
              <h2 className="text-base font-semibold text-zinc-100">
                Assigned Devices
              </h2>
              {devices.length > 0 && (
                <Link
                  href="/staff/devices"
                  className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition-colors"
                >
                  <span>View all ({devices.length})</span>
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {devices.length === 0 ? (
              <Card className="py-8 px-6 text-center border-dashed border-zinc-800 space-y-3">
                <div className="mx-auto w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                  <Laptop className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-zinc-200">
                    No devices currently assigned
                  </p>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto">
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
                    className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                        <Laptop className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-zinc-100">
                            {device.name}
                          </h3>
                          <Badge variant="active" label="In Custody" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400">
                          <span>Serial:</span>
                          <button
                            onClick={() => copyToClipboard(device.serialNumber || "N/A")}
                            className="font-mono text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                            title="Click to copy serial"
                          >
                            <span>{device.serialNumber || "None"}</span>
                            {copiedSerial === device.serialNumber ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3 text-zinc-500" />
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
                      className="text-xs text-zinc-400 hover:text-zinc-200"
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
              <h2 className="text-base font-semibold text-zinc-100">
                Recent Support Requests
              </h2>
              <Link
                href="/staff/tickets"
                className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
              >
                <span>View all tickets</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {complaints.length === 0 ? (
              <Card className="py-6 px-4 text-center border-dashed border-zinc-800">
                <p className="text-xs text-zinc-400">
                  No support tickets on file. Everything is running smoothly.
                </p>
              </Card>
            ) : (
              <div className="space-y-2.5">
                {complaints.slice(0, 4).map((ticket) => (
                  <Link key={ticket.id} href="/staff/tickets" className="block">
                    <Card className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-zinc-700/80 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-zinc-300">
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
                        <p className="text-sm font-medium text-zinc-200">
                          {ticket.title}
                        </p>
                      </div>

                      <div className="text-right shrink-0 text-xs text-zinc-400 flex items-center gap-2">
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
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
          <Card className="space-y-4 p-5">
            <h3 className="text-sm font-semibold text-zinc-100">
              IT Support & Helpdesk
            </h3>

            <div className="space-y-2 text-xs text-zinc-400">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-zinc-300">Room 310 Helpdesk</p>
                  <p>Monday – Friday, 08:00 – 18:00</p>
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2 border-t border-zinc-800/80">
                <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-zinc-300">Hardware Stewardship</p>
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
                rightIcon={<ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
              >
                View Equipment Guidelines
              </Button>
            </div>
          </Card>

          {/* IT Notices */}
          <Card className="space-y-3 p-5">
            <h3 className="text-sm font-semibold text-zinc-100">
              Notice
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Standard operating system updates occur automatically over weekends. Please keep assigned devices connected to power.
            </p>
            <div className="pt-1">
              <a
                href="mailto:ezekielgoodness@r4cglobal.org"
                className="text-xs text-zinc-400 hover:text-zinc-200 inline-flex items-center gap-1 transition-colors"
              >
                <span>Contact IT Administration</span>
                <ExternalLink className="w-3 h-3" />
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
        <div className="space-y-4 text-xs text-zinc-300 leading-relaxed">
          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/60 space-y-1">
            <h4 className="font-medium text-zinc-100">1. Custody and Care</h4>
            <p className="text-zinc-400">
              Assigned equipment remains the property of R4C Global and should be handled with reasonable care against loss and liquid damage.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/60 space-y-1">
            <h4 className="font-medium text-zinc-100">2. Issue Reporting</h4>
            <p className="text-zinc-400">
              If an assigned device experiences a hardware malfunction or physical damage, file a ticket through this portal so a replacement or repair can be coordinated.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/60 space-y-1">
            <h4 className="font-medium text-zinc-100">3. Return Timeline</h4>
            <p className="text-zinc-400">
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
