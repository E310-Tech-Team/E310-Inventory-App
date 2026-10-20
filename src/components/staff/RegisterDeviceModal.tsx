"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import {
  Laptop,
  CheckCircle2,
  AlertCircle,
  Hash,
  FileText,
  ShieldAlert,
  Info,
} from "lucide-react";

interface RegisterDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface DropdownOption {
  value: string;
  label: string;
}

export function RegisterDeviceModal({
  isOpen,
  onClose,
  onSuccess,
}: RegisterDeviceModalProps) {
  const [deviceTypes, setDeviceTypes] = useState<DropdownOption[]>([]);
  const [deviceBrands, setDeviceBrands] = useState<DropdownOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  // Form fields
  const [deviceType, setDeviceType] = useState("");
  const [deviceBrand, setDeviceBrand] = useState("");
  const [modelName, setModelName] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [condition, setCondition] = useState("good");
  const [notes, setNotes] = useState("");

  // Validation & Submission
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serialError, setSerialError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  // Fetch dropdown options on open
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
          setDeviceTypes(data.deviceTypes || []);
          setDeviceBrands(data.deviceBrands || []);
        }
      } catch (err) {
        console.warn("Using fallback options for device registration:", err);
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    }

    loadOptions();
    setError(null);
    setSerialError(null);
    setSuccessToast(false);

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  const validateForm = () => {
    if (!deviceType) {
      setError("Please select a device type.");
      return false;
    }
    if (!deviceBrand) {
      setError("Please select the manufacturer or brand.");
      return false;
    }
    if (!modelName.trim()) {
      setError("Please specify the device model name (e.g. MacBook Pro 14, ThinkPad T14).");
      return false;
    }
    if (!serialNumber.trim()) {
      setSerialError("Hardware serial number or service tag is required.");
      return false;
    }
    if (serialNumber.trim().length < 3) {
      setSerialError("Serial number must be at least 3 characters long.");
      return false;
    }
    setError(null);
    setSerialError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setError(null);
      setSerialError(null);

      const fullName = `${deviceBrand.toUpperCase()} ${modelName.trim()}`;

      const res = await fetch("/api/staff/devices/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          deviceType,
          serialNumber: serialNumber.trim(),
          condition,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.error?.includes("already registered")) {
          setSerialError(data.error || "A device with this serial number already exists.");
        } else {
          setError(data.error || "Failed to register device. Please try again.");
        }
        return;
      }

      // Success
      setSuccessToast(true);
      setTimeout(() => {
        onSuccess();
        onClose();
        // Reset form
        setDeviceType("");
        setDeviceBrand("");
        setModelName("");
        setSerialNumber("");
        setCondition("good");
        setNotes("");
      }, 1200);
    } catch (err: any) {
      setError(err.message || "Network error. Please check your connection.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Device"
      description="Self-register assigned office hardware or personal work devices into your custody."
      size="md"
    >
      {successToast ? (
        <div className="py-8 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in">
          <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-foreground">Device Registered!</h3>
          <p className="text-sm text-muted max-w-xs">
            Your device has been registered and is now listed under your active custody.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Device Type"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              options={deviceTypes}
              disabled={loadingOptions || submitting}
              required
            />

            <Select
              label="Brand / Manufacturer"
              value={deviceBrand}
              onChange={(e) => setDeviceBrand(e.target.value)}
              options={deviceBrands}
              disabled={loadingOptions || submitting}
              required
            />
          </div>

          <Input
            label="Model Name / Specification"
            placeholder="e.g. MacBook Air M2 16GB"
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            disabled={submitting}
            leftIcon={<Laptop className="w-4 h-4" />}
            required
          />

          <Input
            label="Hardware Serial Number / Service Tag"
            placeholder="e.g. C02G789XMD6R"
            value={serialNumber}
            onChange={(e) => {
              setSerialNumber(e.target.value);
              if (serialError) setSerialError(null);
            }}
            error={serialError || undefined}
            disabled={submitting}
            leftIcon={<Hash className="w-4 h-4" />}
            helperText="Located on the bottom chassis, battery compartment, or in System Info."
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="Physical Condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              options={[
                { value: "new", label: "Brand New / Sealed" },
                { value: "good", label: "Good / Minor Wear" },
                { value: "fair", label: "Fair / Visible Scuffs" },
                { value: "damaged", label: "Damaged / Pre-existing fault" },
              ]}
              disabled={submitting}
            />

            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-elevated border border-border text-[11px] text-muted">
              <Info className="w-4 h-4 shrink-0 text-brand-teal dark:text-teal-400" />
              <span>Custody takes effect immediately upon submission.</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Additional Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Includes original charger and adapter..."
              className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground placeholder:text-muted focus:outline-hidden focus:border-accent transition-colors resize-none"
              disabled={submitting}
            />
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-border">
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
              Register Device
            </Button>
          </div>
        </form>
      )}

    </Modal>
  );
}
