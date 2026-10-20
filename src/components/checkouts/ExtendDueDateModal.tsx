"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkout } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";
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

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Staff Custodian:</span>
            <span className="font-semibold text-slate-800">{checkout.assignedToName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Current Due Date:</span>
            <span className="font-mono text-slate-700">
              {checkout.dueDate
                ? new Date(checkout.dueDate).toLocaleDateString()
                : "Open-ended (No due date)"}
            </span>
          </div>
        </div>

        {/* Date Input */}
        <FormField label="New Due Date">
          <div className="relative">
            <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              required
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              className={`${inputClass} pl-9 font-mono`}
            />
          </div>
        </FormField>

        {/* Quick extension shortcuts */}
        <div>
          <span className="text-[11px] font-medium text-slate-500">Quick extensions:</span>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {[
              { label: "+7 Days", days: 7 },
              { label: "+14 Days", days: 14 },
              { label: "+30 Days", days: 30 },
              { label: "+60 Days", days: 60 },
            ].map((shortcut) => (
              <button
                key={shortcut.label}
                type="button"
                onClick={() => addDays(shortcut.days)}
                className="px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                {shortcut.label}
              </button>
            ))}
          </div>
        </div>

        <FormField label="Extension Justification / Notes (optional)">
          <textarea
            rows={2}
            value={extensionNotes}
            onChange={(e) => setExtensionNotes(e.target.value)}
            placeholder="e.g. Project timeline extended; approved by department lead."
            className={inputClass}
          />
        </FormField>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
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
