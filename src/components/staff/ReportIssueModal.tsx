"use client";

import React, { useState, useEffect, useId } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { StaffDevice } from "@/types";
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Check,
  Copy,
  Plus,
  Trash2,
  ImageIcon,
  MapPin,
  Clock,
  Zap,
  Flame,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  devices?: StaffDevice[];
  preselectedDevice?: StaffDevice | null;
}

interface DropdownOption {
  value: string;
  label: string;
}

const DEFAULT_ISSUE_TYPES: DropdownOption[] = [
  { value: "Hardware Failure", label: "Hardware Failure / Defective Part" },
  { value: "Physical Damage", label: "Physical Damage (Screen, Casing, Ports)" },
  { value: "Battery & Power", label: "Battery Drain / Won't Power On / Charger" },
  { value: "Software & OS", label: "OS Crash / Bootloop / Kernel Panic" },
  { value: "Network & Connectivity", label: "Wi-Fi / Ethernet / Bluetooth Issue" },
  { value: "Peripheral / Accessory", label: "Monitor / Docking Station / Keyboard / Mouse" },
  { value: "Performance Lag", label: "Severe Overheating / System Throttling" },
  { value: "Other", label: "Other General Inconvenience" },
];

const SEVERITY_LEVELS = [
  {
    value: "low",
    label: "Low",
    badgeClass: "border-border bg-surface-elevated text-muted",
    activeClass: "border-sky-500/50 bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/40",
    description: "Minor cosmetic defect, work continues normally",
    icon: Clock,
  },
  {
    value: "medium",
    label: "Medium",
    badgeClass: "border-border bg-surface-elevated text-muted",
    activeClass: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/40",
    description: "Performance degraded, work partially impeded",
    icon: Zap,
  },
  {
    value: "high",
    label: "High",
    badgeClass: "border-border bg-surface-elevated text-muted",
    activeClass: "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-300 ring-1 ring-orange-500/40",
    description: "Hardware non-functional, primary work stopped",
    icon: AlertTriangle,
  },
  {
    value: "critical",
    label: "Critical",
    badgeClass: "border-border bg-surface-elevated text-muted",
    activeClass: "border-rose-500/50 bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-1 ring-rose-500/40",
    description: "Battery swelling, safety hazard, urgent outage",
    icon: Flame,
  },
] as const;


export function ReportIssueModal({
  isOpen,
  onClose,
  onSuccess,
  devices = [],
  preselectedDevice = null,
}: ReportIssueModalProps) {
  const [issueTypes, setIssueTypes] = useState<DropdownOption[]>(DEFAULT_ISSUE_TYPES);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form state
  const [selectedItemId, setSelectedItemId] = useState<string>(
    () => preselectedDevice?.itemId || (devices.length > 0 ? devices[0].itemId : "")
  );
  const [lastPreselectedId, setLastPreselectedId] = useState<string | null>(
    preselectedDevice?.itemId ?? null
  );

  // Adjust state during render when preselectedDevice changes (React recommended pattern)
  if (preselectedDevice?.itemId && preselectedDevice.itemId !== lastPreselectedId) {
    setLastPreselectedId(preselectedDevice.itemId);
    setSelectedItemId(preselectedDevice.itemId);
  }

  const [issueType, setIssueType] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [attachmentInput, setAttachmentInput] = useState<string>("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);

  // Submission & Feedback state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const descId = useId();

  // Load issue categories dynamically from API
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const res = await fetch("/api/staff/options");
        if (!res.ok) throw new Error("Failed to load options");
        const data = await res.json();
        if (mounted && Array.isArray(data.issueTypes) && data.issueTypes.length > 0) {
          setIssueTypes(data.issueTypes);
          setIssueType((current) => current || data.issueTypes[0].value);
        }
      } catch (err) {
        console.warn("Using fallback issue categories:", err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleAddAttachment = () => {
    const trimmed = attachmentInput.trim();
    if (!trimmed) return;
    if (attachmentUrls.includes(trimmed)) {
      setError("Attachment URL already added.");
      return;
    }
    setAttachmentUrls((prev) => [...prev, trimmed]);
    setAttachmentInput("");
    setError(null);
  };

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachmentUrls((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleCopyTicket = (ticketNumber: string) => {
    navigator.clipboard.writeText(ticketNumber);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2500);
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setAttachmentInput("");
    setAttachmentUrls([]);
    setPriority("medium");
    setError(null);
    setSuccessTicket(null);
    setCopiedTicket(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a summary title for the issue.");
      return;
    }
    if (!description.trim()) {
      setError("Please provide a description of the problem.");
      return;
    }
    if (!issueType) {
      setError("Please select an issue category.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Construct description with optional location detail
      let finalDescription = description.trim();
      if (location.trim()) {
        finalDescription += `\n\n[Location/Workstation]: ${location.trim()}`;
      }

      const res = await fetch("/api/staff/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: finalDescription,
          issueType,
          priority,
          itemId: selectedItemId || undefined,
          attachmentUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit ticket. Please try again.");
        return;
      }

      const ticketNum = data.complaint?.ticket_number || "TKT-LOGGED";
      setSuccessTicket(ticketNum);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to submit ticket.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    resetForm();
    onSuccess();
    onClose();
  };

  const selectedDevice = devices.find((d) => d.itemId === selectedItemId);

  const deviceOptions = [
    { value: "", label: "General Hardware / Unlisted Equipment" },
    ...devices.map((d) => ({
      value: d.itemId,
      label: `${d.name} (${d.serialNumber || "No Serial"})`,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="File a Complaint / Repair Request"
      description="Report a hardware defect or request technical service from the E310 IT team."
      size="lg"
    >
      {successTicket ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
          <div className="h-16 w-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/5">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-foreground">Ticket Successfully Registered</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              Your service request has been logged and dispatched to the on-duty IT Support specialists.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl px-4 py-3 shadow-xs">
            <span className="text-xs text-muted font-mono">Ticket #:</span>
            <span className="text-sm font-mono font-bold text-brand-teal dark:text-teal-400 tracking-wider">
              {successTicket}
            </span>
            <button
              type="button"
              onClick={() => handleCopyTicket(successTicket)}
              className="ml-2 p-1.5 rounded-lg hover:bg-surface text-muted hover:text-foreground transition-colors"
              title="Copy Ticket ID"
            >
              {copiedTicket ? (
                <Check className="w-4 h-4 text-brand-teal dark:text-teal-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          <p className="text-[11px] text-muted max-w-xs">
            You can monitor live status updates, technician notes, and resolution progress directly in your support tracker.
          </p>

          <div className="pt-2">
            <Button variant="primary" size="sm" onClick={handleDone} rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              Done & Return to Dashboard
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── 1. Affected Device Selection ─── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Affected Hardware Device
              </label>
              {selectedDevice && (
                <span className="text-[11px] text-muted font-mono">
                  SN: {selectedDevice.serialNumber || "N/A"}
                </span>
              )}
            </div>

            {devices.length > 0 ? (
              <Select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                options={deviceOptions}
                disabled={submitting}
                leftIcon={<Laptop className="w-4 h-4" />}
              />
            ) : (
              <div className="p-3 rounded-xl border border-border bg-surface-elevated text-xs text-muted flex items-center gap-2">
                <Laptop className="w-4 h-4 text-muted shrink-0" />
                <span>General Hardware / Unassigned Equipment</span>
              </div>
            )}
          </div>


          {/* ─── 2. Category & Severity ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Issue Category"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              options={issueTypes}
              disabled={loadingOptions || submitting}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Urgency & Severity Level
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {SEVERITY_LEVELS.map((lvl) => {
                  const Icon = lvl.icon;
                  const isSelected = priority === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setPriority(lvl.value)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all text-left ${
                        isSelected ? lvl.activeClass : lvl.badgeClass
                      } hover:border-accent/40`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── 3. Title & Location ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Brief Summary of Issue"
                placeholder="e.g. Screen flickering or battery discharging in 20 minutes"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                leftIcon={<AlertTriangle className="w-4 h-4" />}
                required
              />
            </div>
            <div>
              <Input
                label="Desk / Location (Optional)"
                placeholder="e.g. Floor 2, Desk 14"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={submitting}
                leftIcon={<MapPin className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* ─── 4. Detailed Description ─── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={descId} className="block text-xs font-semibold text-foreground">
                Detailed Description of Fault
              </label>
              <span className="text-[11px] text-muted">
                {description.length} chars
              </span>
            </div>
            <textarea
              id={descId}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, any error messages displayed, unusual sounds, and when the issue started..."
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:border-accent transition-colors resize-none"
              disabled={submitting}
              required
            />
          </div>

          {/* ─── 5. Evidence / Attachment URLs ─── */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-foreground">
              Evidence / Photo Attachments (Optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Paste image / screenshot URL (e.g. https://...)"
                  value={attachmentInput}
                  onChange={(e) => setAttachmentInput(e.target.value)}
                  disabled={submitting}
                  leftIcon={<ImageIcon className="w-4 h-4" />}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAttachment();
                    }
                  }}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddAttachment}
                disabled={!attachmentInput.trim() || submitting}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Attach
              </Button>
            </div>

            {attachmentUrls.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {attachmentUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-surface-elevated border border-border text-[11px] text-foreground max-w-xs truncate"
                  >
                    <ImageIcon className="w-3 h-3 text-muted shrink-0" />
                    <span className="truncate">{url}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="ml-1 p-0.5 rounded text-muted hover:text-rose-500 transition-colors"
                      title="Remove attachment"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Footer Controls ─── */}
          <div className="pt-3 flex items-center justify-between border-t border-border">
            <div className="text-[11px] text-muted">
              Assigned IT specialists will triage ticket according to priority.
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={submitting}
                leftIcon={submitting ? undefined : <ShieldAlert className="w-3.5 h-3.5" />}
              >
                Submit Service Ticket
              </Button>
            </div>
          </div>
        </form>
      )}

    </Modal>
  );
}

// Export alias for semantic naming
export { ReportIssueModal as CreateComplaintModal };
