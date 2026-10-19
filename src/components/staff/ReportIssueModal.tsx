"use client";

import React, { useState, useEffect } from "react";
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
  HelpCircle,
  FileQuestion,
} from "lucide-react";

interface ReportIssueModalProps {
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

export function ReportIssueModal({
  isOpen,
  onClose,
  onSuccess,
  devices = [],
  preselectedDevice = null,
}: ReportIssueModalProps) {
  const [issueTypes, setIssueTypes] = useState<DropdownOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form state
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [issueType, setIssueType] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successTicket, setSuccessTicket] = useState<string | null>(null);

  // Sync preselected device
  useEffect(() => {
    if (preselectedDevice) {
      setSelectedItemId(preselectedDevice.itemId);
    } else if (devices.length > 0 && !selectedItemId) {
      setSelectedItemId(devices[0].itemId);
    }
  }, [preselectedDevice, devices, selectedItemId]);

  // Load issue categories
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    async function loadOptions() {
      try {
        setLoadingOptions(true);
        const res = await fetch("/api/staff/options");
        if (!res.ok) throw new Error("Failed to load options");
        const data = await res.json();
        if (mounted) {
          setIssueTypes(data.issueTypes || []);
        }
      } catch (err) {
        console.warn("Using fallback issue types:", err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    loadOptions();
    setError(null);
    setSuccessTicket(null);

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !issueType) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch("/api/staff/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          issueType,
          priority,
          itemId: selectedItemId || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to submit ticket. Please try again.");
        return;
      }

      const ticketNum = data.complaint?.ticket_number || "TKT-LOGGED";
      setSuccessTicket(ticketNum);

      setTimeout(() => {
        onSuccess();
        onClose();
        setTitle("");
        setDescription("");
        setIssueType("");
        setPriority("medium");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

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
      onClose={onClose}
      title="Report Hardware Problem"
      description="File an urgent service ticket with the E310 IT Support team."
      size="md"
    >
      {successTicket ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">Ticket Submitted</h3>
          <p className="text-sm font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            {successTicket}
          </p>
          <p className="text-xs text-neutral-400 max-w-xs">
            An IT support specialist has been dispatched to review your request.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {devices.length > 0 && (
            <Select
              label="Affected Hardware Device"
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              options={deviceOptions}
              disabled={submitting}
              leftIcon={<Laptop className="w-4 h-4" />}
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Problem Category"
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              options={issueTypes}
              disabled={loadingOptions || submitting}
              required
            />

            <Select
              label="Urgency / Severity"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { value: "low", label: "Low - Minor Cosmetic / Inconvenience" },
                { value: "medium", label: "Medium - Work Impeded" },
                { value: "high", label: "High - Device Non-Functional" },
                { value: "critical", label: "Critical - Work Stopped / Safety Hazard" },
              ]}
              disabled={submitting}
            />
          </div>

          <Input
            label="Brief Summary of Issue"
            placeholder="e.g. Battery drains rapidly and laptop shuts down unexpectedly"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={submitting}
            leftIcon={<AlertTriangle className="w-4 h-4" />}
            required
          />

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-zinc-300">
              Detailed Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, any error messages, and when it started..."
              className="w-full rounded-md border border-zinc-800 bg-zinc-900 p-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-400 focus:border-zinc-400 transition-colors resize-none"
              disabled={submitting}
              required
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={submitting}
            >
              Submit Ticket
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
