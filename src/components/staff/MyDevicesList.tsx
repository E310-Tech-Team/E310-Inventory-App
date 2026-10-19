"use client";

import React, { useState } from "react";
import { StaffDevice } from "@/types";
import { Card } from "@/components/common/Card";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { RegisterDeviceModal } from "@/components/staff/RegisterDeviceModal";
import { ReportIssueModal } from "@/components/staff/ReportIssueModal";
import {
  Laptop,
  Smartphone,
  Tablet,
  Tv,
  HardDrive,
  Copy,
  Check,
  Calendar,
  AlertTriangle,
  PlusCircle,
  Clock,
  ShieldCheck,
  Wrench,
  Sparkles,
} from "lucide-react";

interface MyDevicesListProps {
  devices: StaffDevice[];
  onRefresh?: () => void;
}

export function MyDevicesList({ devices, onRefresh }: MyDevicesListProps) {
  const [copiedSerial, setCopiedSerial] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [selectedDeviceForIssue, setSelectedDeviceForIssue] = useState<StaffDevice | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSerial(text);
    setTimeout(() => setCopiedSerial(null), 2000);
  };

  const getDeviceIcon = (name: string, category: string) => {
    const term = `${name} ${category}`.toLowerCase();
    if (term.includes("phone") || term.includes("mobile")) return Smartphone;
    if (term.includes("pad") || term.includes("tablet")) return Tablet;
    if (term.includes("monitor") || term.includes("display") || term.includes("screen")) return Tv;
    return Laptop;
  };

  const formatCustodyDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const handleReportIssue = (device: StaffDevice) => {
    setSelectedDeviceForIssue(device);
    setIsReportOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>My Assigned Equipment</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              {devices.length} {devices.length === 1 ? "device" : "devices"}
            </span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Official hardware issued into your custody with real-time status and warranty support.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<PlusCircle className="w-4 h-4 text-emerald-400" />}
          onClick={() => setIsRegisterOpen(true)}
        >
          Register Another Device
        </Button>
      </div>

      {/* Device Cards Grid */}
      {devices.length === 0 ? (
        <Card className="text-center py-12 px-6 flex flex-col items-center justify-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-neutral-800/80 border border-white/[0.08] flex items-center justify-center text-neutral-400 shadow-inner">
            <HardDrive className="w-8 h-8 text-neutral-500" />
          </div>
          <div className="max-w-md space-y-1.5">
            <h3 className="text-base font-semibold text-white">No Assigned Devices Found</h3>
            <p className="text-xs text-neutral-400">
              You currently do not have any registered hardware in your custody. If you have an office laptop or phone, you can self-register it now.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<PlusCircle className="w-4 h-4" />}
            onClick={() => setIsRegisterOpen(true)}
          >
            Register My Device
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {devices.map((device) => {
            const Icon = getDeviceIcon(device.name, device.categoryName);
            const isOverdue = device.status === "overdue";
            const hasActiveComplaint = Boolean(device.activeComplaint);

            return (
              <Card
                key={device.checkoutId || device.itemId}
                className="flex flex-col justify-between space-y-4 group"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-neutral-800/90 border border-white/[0.08] flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold">
                            {device.categoryName || "Hardware Asset"}
                          </span>
                          <span className="text-neutral-600">•</span>
                          <span className="text-[11px] font-mono text-neutral-400 capitalize">
                            Condition: {device.condition || "Good"}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-white tracking-tight mt-0.5">
                          {device.name}
                        </h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOverdue ? (
                        <Badge variant="overdue" label="OVERDUE" />
                      ) : (
                        <Badge variant="active" label="IN CUSTODY" />
                      )}
                    </div>
                  </div>

                  {/* Serial Number & Custody Details */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/40 border border-white/[0.05]">
                      <span className="text-[11px] font-mono text-neutral-400">SERIAL NO</span>
                      <button
                        onClick={() => copyToClipboard(device.serialNumber || "N/A")}
                        className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors pressable"
                        title="Click to copy serial number"
                      >
                        <span>{device.serialNumber || "UNTAGGED"}</span>
                        {copiedSerial === device.serialNumber ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-neutral-500" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/40 border border-white/[0.05]">
                      <span className="text-[11px] font-mono text-neutral-400">COLLECTED</span>
                      <span className="font-mono text-xs text-neutral-200">
                        {formatCustodyDate(device.dateCollected)}
                      </span>
                    </div>
                  </div>

                  {/* Active Ticket Banner */}
                  {hasActiveComplaint && device.activeComplaint && (
                    <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5">
                      <Wrench className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wide">
                            {device.activeComplaint.ticketNumber} • {device.activeComplaint.status}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400 capitalize">
                            {device.activeComplaint.priority} Priority
                          </span>
                        </div>
                        <p className="text-xs text-neutral-200 truncate mt-0.5">
                          {device.activeComplaint.title}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Protected by E310 IT Policy</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                    onClick={() => handleReportIssue(device)}
                  >
                    Report Issue
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <RegisterDeviceModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        onSuccess={() => {
          onRefresh?.();
        }}
      />

      <ReportIssueModal
        isOpen={isReportOpen}
        onClose={() => {
          setIsReportOpen(false);
          setSelectedDeviceForIssue(null);
        }}
        devices={devices}
        preselectedDevice={selectedDeviceForIssue}
        onSuccess={() => {
          onRefresh?.();
        }}
      />
    </div>
  );
}
