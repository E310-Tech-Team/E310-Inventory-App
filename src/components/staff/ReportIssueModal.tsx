"use client";

import React, { useState, useEffect, useId, useRef } from "react";
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
  Clock,
  ShieldAlert,
  ArrowRight,
  UploadCloud,
  Camera,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  AppWindow,
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

const HARDWARE_ISSUE_TYPES: DropdownOption[] = [
  { value: "Screen / Display Damage", label: "Screen / Display Damage (Cracked, Lines, Flickering)" },
  { value: "Battery & Charging Issue", label: "Battery Drain / Won't Charge / Power Adapter" },
  { value: "Physical Hardware Damage", label: "Physical Casing / Hinge / Port Damage" },
  { value: "Keyboard & Trackpad Malfunction", label: "Keyboard Keys Stuck / Trackpad Unresponsive" },
  { value: "Power Failure", label: "Device Won't Turn On / Power Cutting Out" },
  { value: "Audio, Speaker & Camera Fault", label: "Microphone Muffled / Speaker Distorted / Webcam Dead" },
  { value: "Overheating & Fan Noise", label: "Excessive Heat / Fan Spinning at Max Speed" },
  { value: "Peripheral / Cable Fault", label: "Docking Station / External Monitor / Cables" },
  { value: "Other Hardware Defect", label: "Other Physical Hardware Defect" },
];

const SOFTWARE_ISSUE_TYPES: DropdownOption[] = [
  { value: "Operating System Crash", label: "OS Crash / Bootloop / Kernel Panic / BSOD" },
  { value: "Application Freeze & Crash", label: "Application Crashing on Launch / Freezing" },
  { value: "Account Access & SSO", label: "Login Failed / SSO Permissions / Password Lockout" },
  { value: "License & Activation Error", label: "Software License Expired / Activation Error" },
  { value: "VPN & Network Connectivity", label: "VPN Connection Failing / Proxy / Network Error" },
  { value: "Cloud Sync & Storage Error", label: "Google Drive / OneDrive / Cloud File Sync Error" },
  { value: "Email & Calendar Malfunction", label: "Email Client Won't Send / Calendar Sync Bug" },
  { value: "Security Alert / Malware", label: "Antivirus Alert / Suspicious Software Warning" },
  { value: "Other Software Bug", label: "Other Application or Software Bug" },
];

const SOFTWARE_OPTIONS: DropdownOption[] = [
  { value: "Google Workspace", label: "Google Workspace (Gmail, Drive, Docs)" },
  { value: "Slack", label: "Slack" },
  { value: "Microsoft 365", label: "Microsoft 365 / Office / Teams" },
  { value: "Zoom", label: "Zoom Video Conferencing" },
  { value: "macOS Operating System", label: "macOS Operating System" },
  { value: "Windows Operating System", label: "Windows Operating System" },
  { value: "Company VPN", label: "Company VPN / Remote Gateway" },
  { value: "Figma", label: "Figma / Design Suite" },
  { value: "Adobe Creative Cloud", label: "Adobe Creative Cloud" },
  { value: "E310 Internal Tools", label: "E310 Internal Tools / Web Portals" },
  { value: "Custom / Other App", label: "Other Application / Software" },
];

import {
  PriorityCriticalIcon,
  PriorityHighIcon,
  PriorityMediumIcon,
  PriorityLowIcon,
} from "@/components/common/Icons";

const SEVERITY_LEVELS = [
  {
    value: "low",
    label: "Low",
    badgeClass: "border-border/80 bg-surface text-muted hover:text-foreground",
    activeClass: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-300 ring-1 ring-sky-500/30",
    description: "Minor issue / Cosmetic — Scheduled maintenance",
    icon: PriorityLowIcon,
  },
  {
    value: "medium",
    label: "Medium",
    badgeClass: "border-border/80 bg-surface text-muted hover:text-foreground",
    activeClass: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-300 ring-1 ring-amber-500/30",
    description: "Impaired functionality — Standard queue",
    icon: PriorityMediumIcon,
  },
  {
    value: "high",
    label: "High",
    badgeClass: "border-border/80 bg-surface text-muted hover:text-foreground",
    activeClass: "border-orange-500/40 bg-orange-500/10 text-orange-600 dark:text-orange-300 ring-1 ring-orange-500/30",
    description: "Primary work blocked — Urgent service",
    icon: PriorityHighIcon,
  },
  {
    value: "critical",
    label: "Critical",
    badgeClass: "border-border/80 bg-surface text-muted hover:text-foreground",
    activeClass: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-300 ring-1 ring-rose-500/30",
    description: "Full device outage / Safety hazard",
    icon: PriorityCriticalIcon,
  },
] as const;

export function ReportIssueModal({
  isOpen,
  onClose,
  onSuccess,
  devices = [],
  preselectedDevice = null,
}: ReportIssueModalProps) {
  // Domain switcher: Hardware vs Software
  const [issueDomain, setIssueDomain] = useState<"hardware" | "software">("hardware");

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

  const [issueType, setIssueType] = useState<string>(HARDWARE_ISSUE_TYPES[0].value);
  const [softwareName, setSoftwareName] = useState<string>("Google Workspace");
  const [customSoftwareName, setCustomSoftwareName] = useState<string>("");
  const [softwareOs, setSoftwareOs] = useState<string>("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [attachmentInput, setAttachmentInput] = useState<string>("");
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submission & Feedback state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);
  const [copiedTicket, setCopiedTicket] = useState(false);

  const descId = useId();

  // Reset category whenever switching between hardware and software
  const handleDomainChange = (domain: "hardware" | "software") => {
    setIssueDomain(domain);
    setIssueType(domain === "hardware" ? HARDWARE_ISSUE_TYPES[0].value : SOFTWARE_ISSUE_TYPES[0].value);
    setError(null);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, GIF).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image size exceeds the 10MB limit. Please choose a smaller photo.");
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setAttachmentUrls((prev) => [...prev, data.url]);
          return;
        }
      }

      // Resilient fallback: read as Base64 Data URL if server upload fails
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setAttachmentUrls((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Upload failed, falling back to data URL:", err);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setAttachmentUrls((prev) => [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      await processFile(files[i]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
    setIssueDomain("hardware");
    setIssueType(HARDWARE_ISSUE_TYPES[0].value);
    setSoftwareName("Google Workspace");
    setCustomSoftwareName("");
    setSoftwareOs("");
    setTitle("");
    setDescription("");
    setLocation("");
    setAttachmentInput("");
    setAttachmentUrls([]);
    setIsUploading(false);
    setActiveTab("upload");
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
    if (attachmentUrls.length === 0) {
      setError(
        issueDomain === "software"
          ? "Evidence is compulsory: Please upload or attach at least one screenshot showing the software error or bug."
          : "Evidence is compulsory: Please upload or attach at least one photo showing the hardware defect."
      );
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const domainPrefix = issueDomain === "software" ? "[Software]" : "[Hardware]";
      const effectiveSoftware =
        softwareName === "Custom / Other App" && customSoftwareName.trim()
          ? customSoftwareName.trim()
          : softwareName;

      // Construct description with optional environment details
      let finalDescription = description.trim();
      if (issueDomain === "hardware" && location.trim()) {
        finalDescription += `\n\n[Physical Location / Desk]: ${location.trim()}`;
      } else if (issueDomain === "software") {
        if (effectiveSoftware.trim()) {
          finalDescription += `\n\n[Affected Application]: ${effectiveSoftware.trim()}`;
        }
        if (softwareOs.trim()) {
          finalDescription += `\n[Environment / OS Version]: ${softwareOs.trim()}`;
        }
      }

      const res = await fetch("/api/staff/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: finalDescription,
          issueType: `${domainPrefix} ${issueType}`,
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
      title={issueDomain === "hardware" ? "File a Hardware Complaint / Repair Request" : "Report a Software Issue / Technical Bug"}
      description={
        issueDomain === "hardware"
          ? "Report a hardware defect or request technical service from the E310 IT team."
          : "Report an application crash, operating system fault, or software access issue."
      }
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
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* ─── Domain Switcher: Hardware vs Software ─── */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-surface-elevated/80 border border-border/80 gap-1">
            <button
              type="button"
              onClick={() => handleDomainChange("hardware")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-all whitespace-nowrap ${
                issueDomain === "hardware"
                  ? "bg-surface text-foreground shadow-xs border border-border/80"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              <Laptop className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-teal shrink-0" />
              <span className="sm:hidden">Hardware</span>
              <span className="hidden sm:inline">Hardware Device</span>
            </button>

            <button
              type="button"
              onClick={() => handleDomainChange("software")}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-all whitespace-nowrap ${
                issueDomain === "software"
                  ? "bg-surface text-foreground shadow-xs border border-border/80"
                  : "text-muted hover:text-foreground border border-transparent"
              }`}
            >
              <AppWindow className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-teal shrink-0" />
              <span className="sm:hidden">Software</span>
              <span className="hidden sm:inline">Software &amp; Systems</span>
            </button>
          </div>

          {/* ─── 1. Affected Target (Device vs Software) ─── */}
          {issueDomain === "hardware" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold text-foreground">
                  Affected Hardware Device <span className="text-rose-500">*</span>
                </label>
                {selectedDevice && (
                  <span className="text-[11px] text-muted font-mono truncate max-w-[45%]">
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
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Affected Application / System <span className="text-rose-500">*</span>
                </label>
                <Select
                  value={softwareName}
                  onChange={(e) => setSoftwareName(e.target.value)}
                  options={SOFTWARE_OPTIONS}
                  disabled={submitting}
                  leftIcon={<AppWindow className="w-4 h-4" />}
                />
                {softwareName === "Custom / Other App" && (
                  <div className="pt-1.5">
                    <Input
                      placeholder="Specify application name (e.g. Docker, Postman)"
                      value={customSoftwareName}
                      onChange={(e) => setCustomSoftwareName(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-foreground">
                  Running on Device (Optional)
                </label>
                <Select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  options={[
                    { value: "", label: "General / Cloud / Not Device Specific" },
                    ...devices.map((d) => ({
                      value: d.itemId,
                      label: `${d.name} (${d.serialNumber || "No SN"})`,
                    })),
                  ]}
                  disabled={submitting}
                  leftIcon={<Laptop className="w-4 h-4" />}
                />
              </div>
            </div>
          )}

          {/* ─── 2. Category & Severity ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label={issueDomain === "hardware" ? "Hardware Issue Category" : "Software Issue Category"}
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              options={issueDomain === "hardware" ? HARDWARE_ISSUE_TYPES : SOFTWARE_ISSUE_TYPES}
              disabled={submitting}
              required
            />

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Urgency & Severity Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SEVERITY_LEVELS.map((lvl) => {
                  const Icon = lvl.icon;
                  const isSelected = priority === lvl.value;
                  return (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setPriority(lvl.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all text-left ${
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

          {/* ─── 3. Title & Location / OS ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Brief Summary of Issue"
                placeholder={
                  issueDomain === "hardware"
                    ? "e.g. Display backlight intermittent, trackpad unresponsive"
                    : "e.g. SSO login timeout on VPN, Slack crashing on launch"
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="sm:col-span-1">
              {issueDomain === "hardware" ? (
                <Input
                  label="Desk / Location (Optional)"
                  placeholder="e.g. Floor 2, Desk 14"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={submitting}
                />
              ) : (
                <Input
                  label="OS / Environment (Optional)"
                  placeholder="e.g. macOS Sonoma, Chrome 124"
                  value={softwareOs}
                  onChange={(e) => setSoftwareOs(e.target.value)}
                  disabled={submitting}
                />
              )}
            </div>
          </div>

          {/* ─── 4. Detailed Description ─── */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={descId} className="block text-xs font-semibold text-foreground">
                {issueDomain === "hardware" ? "Detailed Description of Fault" : "Bug Description & Steps to Reproduce"}
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
              placeholder={
                issueDomain === "hardware"
                  ? "Describe physical damage, error symptoms, unusual sounds, and when the issue started..."
                  : "Describe what occurred, exact error messages displayed, steps to reproduce, and what you expected..."
              }
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:border-accent focus:ring-1 focus:ring-accent/40 transition-colors resize-none"
              disabled={submitting}
              required
            />
          </div>

          {/* ─── 5. Evidence / Photo Attachments (Compulsory) ─── */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="block text-xs font-semibold text-foreground">
                {issueDomain === "hardware"
                  ? "Evidence / Photo Attachments"
                  : "Evidence / Error Screenshots"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px]">
                {attachmentUrls.length === 0 ? (
                  <span className="text-rose-500 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 inline shrink-0" />
                    Compulsory: At least 1 {issueDomain === "hardware" ? "photo" : "screenshot"} required
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 inline shrink-0" />
                    {attachmentUrls.length} {issueDomain === "hardware" ? "photo" : "screenshot"}
                    {attachmentUrls.length > 1 ? "s" : ""} attached
                  </span>
                )}
              </span>
            </div>

            {/* Mode Selector Tabs */}
            <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 p-1 rounded-xl bg-surface-elevated/80 border border-border/80 w-full sm:w-fit text-xs">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className={`justify-center px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "upload"
                    ? "bg-surface text-foreground shadow-xs border border-border/80"
                    : "text-muted hover:text-foreground border border-transparent"
                }`}
              >
                <Camera className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">Upload Photo</span>
                <span className="hidden sm:inline">Upload Photo / Screenshot</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("url")}
                className={`justify-center px-2.5 sm:px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === "url"
                    ? "bg-surface text-foreground shadow-xs border border-border/80"
                    : "text-muted hover:text-foreground border border-transparent"
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">Paste Link</span>
                <span className="hidden sm:inline">Paste Image Link</span>
              </button>
            </div>

            {/* Hidden native file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
              disabled={submitting || isUploading}
            />

            {/* Upload Area / Dropzone */}
            {activeTab === "upload" ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  handleFiles(e.dataTransfer.files);
                }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDragging
                    ? "border-accent bg-accent/10"
                    : attachmentUrls.length === 0
                    ? "border-rose-400/60 bg-rose-500/5 hover:border-accent hover:bg-surface-elevated"
                    : "border-border bg-surface hover:border-accent hover:bg-surface-elevated"
                }`}
              >
                {isUploading ? (
                  <div className="flex items-center gap-2 text-xs text-muted py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-brand-teal" />
                    <span>Uploading photo evidence...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-center gap-1.5 py-1">
                    <div className="w-10 h-10 rounded-full bg-surface-elevated border border-border flex items-center justify-center text-muted">
                      <UploadCloud className="w-5 h-5 text-brand-teal" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground">
                        Click to select photo
                      </span>
                      <span className="text-xs text-muted"> or drag & drop here</span>
                    </div>
                    <span className="text-[10px] text-muted">
                      Supports JPG, PNG, WEBP, GIF or camera capture (up to 10MB)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <Input
                    placeholder="Paste image / screenshot URL (e.g. https://...)"
                    value={attachmentInput}
                    onChange={(e) => setAttachmentInput(e.target.value)}
                    disabled={submitting}
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
                  className="shrink-0 whitespace-nowrap"
                  onClick={handleAddAttachment}
                  disabled={!attachmentInput.trim() || submitting}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Attach
                </Button>
              </div>
            )}

            {/* Attached Photo Preview Cards */}
            {attachmentUrls.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Attached Photos ({attachmentUrls.length}):
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {attachmentUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative flex items-center gap-2.5 p-2 rounded-xl bg-surface-elevated border border-border text-xs text-foreground transition-all hover:border-border/80"
                    >
                      <div className="w-12 h-12 rounded-lg bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                        <img
                          src={url}
                          alt={`Evidence #${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-xs text-foreground truncate">
                          Photo #{idx + 1}
                        </p>
                        <p className="text-[10px] text-muted truncate max-w-[150px]">
                          {url.startsWith("data:") ? "Direct Image Upload" : url}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface transition-colors"
                          title="Open photo"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(idx)}
                          className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Remove photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── Footer Controls ─── */}
          <div className="pt-3 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 border-t border-border">
            <div className="text-[11px] text-muted text-center sm:text-left">
              Tickets are routed directly to the on-duty IT engineering queue.
            </div>
            <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="justify-center"
                onClick={handleClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="justify-center whitespace-nowrap"
                isLoading={submitting}
              >
                <span className="sm:hidden">Submit Ticket</span>
                <span className="hidden sm:inline">
                  {issueDomain === "hardware" ? "Submit Hardware Ticket" : "Submit Bug Report"}
                </span>
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
