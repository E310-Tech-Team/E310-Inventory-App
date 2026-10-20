"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkout, ItemCondition } from "@/types";
import { Select } from "@/components/common/Select";
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
        <div className="p-3 bg-surface-elevated rounded-xl border border-border text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">Staff Custodian:</span>
            <span className="font-semibold text-foreground">{checkout.assignedToName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Collected On:</span>
            <span className="text-foreground">
              {new Date(checkout.dateCollected).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Return Condition */}
        <div className="mb-4">
          <Select
            label="Condition on Return"
            value={condition}
            onChange={(e) => handleConditionChange(e.target.value as ItemCondition)}
            options={[
              { value: "good", label: "Good (Fully functional)" },
              { value: "new", label: "Like New (Mint condition)" },
              { value: "fair", label: "Fair (Normal cosmetic wear)" },
              { value: "damaged", label: "Damaged (Faulty, broken, or needs repair)" },
            ]}
          />
        </div>

        {/* Damaged Alert Banner */}
        {condition === "damaged" && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-400">
                  Damaged Equipment Alert
                </p>
                <p className="text-[11px] text-amber-300 mt-0.5">
                  An automatic high-priority repair ticket will be submitted to the Tech Team queue upon check-in.
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 pt-1 text-xs font-medium text-amber-400 cursor-pointer">
              <input
                type="checkbox"
                checked={createRepairTicket}
                onChange={(e) => setCreateRepairTicket(e.target.checked)}
                className="rounded border-amber-500/30 text-amber-500 focus:ring-amber-500"
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

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-muted hover:text-foreground bg-surface border border-border rounded-lg hover:bg-surface-elevated transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-yellow hover:brightness-105 text-brand-navy rounded-lg text-xs font-bold transition-all shadow-xs disabled:opacity-50"
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
