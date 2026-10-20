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
  AlertTriangle,
  Plus,
  Wrench,
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div>
          <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
            <span>My Assigned Equipment</span>
            <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-400">
              {devices.length}
            </span>
          </h2>
          <p className="text-xs text-zinc-400 mt-1">
            Hardware items currently registered in your custody.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          leftIcon={<Plus className="w-3.5 h-3.5" />}
          onClick={() => setIsRegisterOpen(true)}
        >
          Register New Device
        </Button>
      </div>

      {/* Device List */}
      {devices.length === 0 ? (
        <Card className="text-center py-12 px-6 border-dashed border-zinc-800 space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-400">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium text-zinc-200">No Devices Found</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              You do not have any registered hardware in your custody. If you have an office device, you can self-register it.
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {devices.map((device) => {
            const Icon = getDeviceIcon(device.name, device.categoryName);
            const isOverdue = device.status === "overdue";
            const hasActiveComplaint = Boolean(device.activeComplaint);

            return (
              <Card
                key={device.checkoutId || device.itemId}
                className="p-4 flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-zinc-400">
                            {device.categoryName || "Device"}
                          </span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-xs text-zinc-400 capitalize">
                            {device.condition || "Good"}
                          </span>
                        </div>
                        <h3 className="text-sm font-medium text-zinc-100 mt-0.5">
                          {device.name}
                        </h3>
                      </div>
                    </div>

                    <Badge
                      variant={isOverdue ? "overdue" : "active"}
                      label={isOverdue ? "Overdue" : "In Custody"}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-md bg-zinc-800/40 border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">Serial</span>
                      <button
                        onClick={() => copyToClipboard(device.serialNumber || "N/A")}
                        className="font-mono text-xs text-zinc-300 hover:text-white flex items-center gap-1 mt-0.5"
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

                    <div className="p-2 rounded-md bg-zinc-800/40 border border-zinc-800">
                      <span className="text-[11px] text-zinc-500 block">Assigned Date</span>
                      <span className="text-xs text-zinc-300 block mt-0.5">
                        {formatCustodyDate(device.dateCollected)}
                      </span>
                    </div>
                  </div>

                  {hasActiveComplaint && device.activeComplaint && (
                    <div className="mt-3 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                      <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-[11px]">
                          Ticket {device.activeComplaint.ticketNumber} ({device.activeComplaint.status})
                        </span>
                        <p className="text-zinc-300 text-xs truncate mt-0.5">
                          {device.activeComplaint.title}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-zinc-800 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-zinc-400" />}
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
