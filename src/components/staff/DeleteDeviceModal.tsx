"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { StaffDevice } from "@/types";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { BadgeVariant } from "@/components/common/Badge";
import { AlertCircle, AlertTriangle, Trash2 } from "lucide-react";

const REGISTRATION_BADGE_MAP: Record<
  NonNullable<StaffDevice["approvalStatus"]>,
  { variant: BadgeVariant; label: string }
> = {
  rejected: { variant: "overdue", label: "Rejected" },
  pending: { variant: "pending", label: "Pending Review" },
  approved: { variant: "neutral", label: "Self-Registered" },
};

export function getRegistrationBadgeMeta(device: StaffDevice) {
  if (!device.registeredByStaff) return null;
  return REGISTRATION_BADGE_MAP[device.approvalStatus ?? "approved"];
}

interface DeleteDeviceModalProps {
  device: StaffDevice | null;
  onClose: () => void;
  onSuccess: () => void;
}

function DeleteDeviceForm({
  device,
  onClose,
  onSuccess,
}: {
  device: StaffDevice;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    try {
      setDeleting(true);
      setError(null);

      const res = await fetch(`/api/staff/devices/${device.itemId}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Failed to delete device. Please try again.");
        return;
      }

      onSuccess();
      router.refresh();
      onClose();
    } catch (err) {
      console.error("Device deletion request failed:", err);
      setError("Network error while deleting device. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-surface-elevated/45 p-3.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground truncate">
            {device.name}
          </p>
          <span className="text-[11px] text-muted shrink-0 capitalize">
            {device.condition}
          </span>
        </div>
        <p className="text-xs text-muted">
          {device.categoryName}
          {device.serialNumber ? ` · SN: ${device.serialNumber}` : ""}
        </p>
      </div>

      {device.activeComplaint && (
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            This device is linked to active ticket{" "}
            <span className="font-mono font-semibold">
              {device.activeComplaint.ticketNumber}
            </span>
            . Deleting the device preserves existing support ticket records.
          </p>
        </div>
      )}

      <p className="text-xs text-muted leading-relaxed">
        This permanently deletes this self-registered hardware entry and removes it
        from your assigned devices list. You can register it again anytime if needed.
      </p>

      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="pt-2 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          size="md"
          className="justify-center"
          onClick={onClose}
          disabled={deleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="md"
          className="justify-center"
          isLoading={deleting}
          leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          onClick={handleDelete}
        >
          {deleting ? "Deleting..." : "Delete Device"}
        </Button>
      </div>
    </div>
  );
}

export function DeleteDeviceModal({
  device,
  onClose,
  onSuccess,
}: DeleteDeviceModalProps) {
  return (
    <Modal
      isOpen={Boolean(device)}
      onClose={onClose}
      title="Delete Registered Device"
      description="Remove a self-registered device from your custody and inventory records."
      size="sm"
    >
      {device && (
        <DeleteDeviceForm
          key={device.itemId}
          device={device}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      )}
    </Modal>
  );
}
