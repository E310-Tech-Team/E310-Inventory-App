"use client";

import React, { useState } from "react";
import { StaffDevice } from "@/types";
import { Badge } from "@/components/common/Badge";
import { Button } from "@/components/common/Button";
import { RegisterDeviceModal } from "@/components/staff/RegisterDeviceModal";
import { ReportIssueModal } from "@/components/staff/ReportIssueModal";
import { ShowMoreBar } from "@/components/ui/ShowMoreBar";
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
  const [mobileLimit, setMobileLimit] = useState(5);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              My Assigned Equipment
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-elevated text-muted font-medium border border-border/70 tabular-nums">
              {devices.length}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted mt-0.5 sm:mt-1">
            Hardware items currently registered in your custody.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          className="w-full sm:w-auto justify-center"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsRegisterOpen(true)}
        >
          Register New Device
        </Button>
      </div>

      {/* Device List */}
      {devices.length === 0 ? (
        <div className="rounded-2xl text-center py-12 px-6 border border-dashed border-border/80 bg-surface/60 space-y-3">
          <div className="mx-auto w-11 h-11 rounded-xl bg-accent-soft flex items-center justify-center text-accent">
            <HardDrive className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">No Devices Found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
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
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {devices.map((device, idx) => {
              const Icon = getDeviceIcon(device.name, device.categoryName);
              const isOverdue = device.status === "overdue";
              const hasActiveComplaint = Boolean(device.activeComplaint);

              return (
                <div
                  key={device.checkoutId || device.itemId}
                  className={`${
                    idx >= mobileLimit ? "hidden md:flex" : "flex"
                  } rounded-2xl p-3.5 sm:p-5 flex-col justify-between space-y-2.5 sm:space-y-4 border border-border/70 bg-surface shadow-[0_1px_4px_rgba(0,0,0,0.02)] hover:border-border transition-colors`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent-soft flex items-center justify-center text-accent shrink-0">
                          <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs text-muted">
                            <span className="truncate font-medium">
                              {device.categoryName || "Device"}
                            </span>
                            <span className="text-muted/50">•</span>
                            <span className="capitalize">
                              {device.condition || "Good"}
                            </span>
                          </div>
                          <h3 className="text-sm font-semibold text-foreground mt-0.5 truncate">
                            {device.name}
                          </h3>
                        </div>
                      </div>

                      <Badge
                        variant={isOverdue ? "overdue" : "active"}
                        label={isOverdue ? "Overdue" : "In Custody"}
                      />
                    </div>

                    <div className="mt-2.5 sm:mt-4 pt-2.5 sm:pt-3 border-t border-border/50 grid grid-cols-2 gap-3 sm:gap-4 text-xs">
                      <div className="min-w-0">
                        <span className="text-[11px] text-muted block font-medium">Serial Number</span>
                        <button
                          onClick={() => copyToClipboard(device.serialNumber || "N/A")}
                          className="font-mono text-xs text-foreground hover:text-accent flex items-center gap-1.5 mt-0.5 sm:mt-1 transition-colors max-w-full"
                          title="Click to copy serial"
                        >
                          <span className="truncate">{device.serialNumber || "None"}</span>
                          {copiedSerial === device.serialNumber ? (
                            <Check className="w-3.5 h-3.5 text-status-available shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-muted shrink-0" />
                          )}
                        </button>
                      </div>

                      <div>
                        <span className="text-[11px] text-muted block font-medium">Assigned Date</span>
                        <span className="text-xs text-foreground block mt-0.5 sm:mt-1 font-mono tabular-nums">
                          {formatCustodyDate(device.dateCollected)}
                        </span>
                      </div>
                    </div>

                    {hasActiveComplaint && device.activeComplaint && (
                      <div className="mt-2.5 sm:mt-3.5 p-2.5 sm:p-3 rounded-xl bg-amber-500/8 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                        <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-[11px]">
                            Ticket {device.activeComplaint.ticketNumber} · {device.activeComplaint.status}
                          </span>
                          <p className="text-foreground/80 text-xs truncate mt-0.5 font-medium">
                            {device.activeComplaint.title}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="pt-2 sm:pt-3 border-t border-border/50 flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      leftIcon={<AlertTriangle className="w-3.5 h-3.5 text-muted" />}
                      onClick={() => handleReportIssue(device)}
                    >
                      Report Issue
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="md:hidden">
            <ShowMoreBar
              visibleCount={Math.min(mobileLimit, devices.length)}
              totalCount={devices.length}
              initialLimit={5}
              noun="devices"
              standalone
              onShowMore={() => setMobileLimit((prev) => prev + 5)}
              onCollapse={() => setMobileLimit(5)}
            />
          </div>
        </>
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
