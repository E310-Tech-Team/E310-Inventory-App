"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkout, ItemCondition } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";
import { AlertTriangle, CheckCircle2, RefreshCw, Wrench } from "lucide-react";

export function CheckInModal({
  checkout,
  itemName,
  onClose,
}: {
  checkout: Checkout;
  itemName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [condition, setCondition] = useState<ItemCondition>("good");
  const [notes, setNotes] = useState("");
  const [createRepairTicket, setCreateRepairTicket] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-enable repair ticket toggle when condition is damaged
  const handleConditionChange = (newCondition: ItemCondition) => {
    setCondition(newCondition);
    if (newCondition === "damaged") {
      setCreateRepairTicket(true);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/checkouts/${checkout.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conditionOnReturn: condition,
          returnNotes: notes || null,
          createRepairTicket: condition === "damaged" || createRepairTicket,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Couldn't check in item.");
      }

      router.refresh();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to check in item");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={`Return Equipment — ${itemName}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Custody summary */}
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Staff Custodian:</span>
            <span className="font-semibold text-slate-800">{checkout.assignedToName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Collected On:</span>
            <span className="text-slate-700">
              {new Date(checkout.dateCollected).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Return Condition */}
        <FormField label="Condition on Return">
          <select
            className={inputClass}
            value={condition}
            onChange={(e) => handleConditionChange(e.target.value as ItemCondition)}
          >
            <option value="good">Good (Fully functional)</option>
            <option value="new">Like New (Mint condition)</option>
            <option value="fair">Fair (Normal cosmetic wear)</option>
            <option value="damaged">Damaged (Faulty, broken, or needs repair)</option>
          </select>
        </FormField>

        {/* Damaged Alert Banner */}
        {condition === "damaged" && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-900">
                  Damaged Equipment Alert
                </p>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  An automatic high-priority repair ticket will be submitted to the Tech Team queue upon check-in.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs font-medium text-amber-900 cursor-pointer">
              <input
                type="checkbox"
                checked={createRepairTicket}
                onChange={(e) => setCreateRepairTicket(e.target.checked)}
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
              />
              <span>Generate immediate triage ticket in Tech Queue</span>
            </label>
          </div>
        )}

        <FormField label="Return Notes (optional)">
          <textarea
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder={
              condition === "damaged"
                ? "Describe the damage, faults, or missing accessories..."
                : "Any comments on return condition or missing components?"
            }
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
            ) : condition === "damaged" ? (
              <Wrench className="w-3.5 h-3.5" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
            <span>{saving ? "Checking in…" : "Confirm Return"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
