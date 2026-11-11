"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkout } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";
import { DatePicker } from "@/components/common/DatePicker";
import { Calendar, Clock, RefreshCw, Check } from "lucide-react";

export function ExtendDueDateModal({
  checkout,
  itemName,
  onClose,
}: {
  checkout: Checkout;
  itemName: string;
  onClose: () => void;
}) {
  const router = useRouter();

  const currentDue = checkout.dueDate
    ? new Date(checkout.dueDate).toISOString().split("T")[0]
    : "";

  const [newDueDate, setNewDueDate] = useState(currentDue);
  const [extensionNotes, setExtensionNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addDays = (days: number) => {
    const base = newDueDate ? new Date(newDueDate) : new Date();
    base.setDate(base.getDate() + days);
    setNewDueDate(base.toISOString().split("T")[0]);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!newDueDate) {
      setError("Please select a valid new due date.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const combinedNotes = checkout.collectionNotes
        ? `${checkout.collectionNotes}\n[Due Date Extended to ${newDueDate}: ${extensionNotes || "No notes provided"}]`
        : `[Due Date Extended to ${newDueDate}: ${extensionNotes || "No notes provided"}]`;

      const res = await fetch(`/api/checkouts/${checkout.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dueDate: new Date(newDueDate).toISOString(),
          collectionNotes: combinedNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to extend due date.");
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to extend due date");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Extend Due Date — ${itemName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="p-3 bg-surface-elevated rounded-xl border border-border text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">Staff Custodian:</span>
            <span className="font-semibold text-foreground">{checkout.assignedToName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Current Due Date:</span>
            <span className="font-mono text-foreground">
              {checkout.dueDate
                ? new Date(checkout.dueDate).toLocaleDateString()
                : "Open-ended (No due date)"}
            </span>
          </div>
        </div>

        {/* Date Input with Themed Calendar */}
        <DatePicker
          label="New Due Date"
          required
          value={newDueDate}
          onChange={setNewDueDate}
          minDate={new Date().toISOString().split("T")[0]}
          placeholder="Select new due date"
          showShortcuts={true}
        />

        <FormField label="Extension Justification / Notes (optional)">
          <textarea
            rows={2}
            value={extensionNotes}
            onChange={(e) => setExtensionNotes(e.target.value)}
            placeholder="e.g. Project timeline extended; approved by department lead."
            className={inputClass}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground bg-surface border border-border/80 rounded-xl hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
          >
            {saving ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Extending…" : "Save Due Date"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
