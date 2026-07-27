"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Checkout, ItemCondition } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";

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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const response = await fetch(`/api/checkouts/${checkout.id}/return`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conditionOnReturn: condition, returnNotes: notes || null }),
    });

    if (!response.ok) {
      setError("Couldn't check in item. Try again.");
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal title={`Check in — ${itemName}`} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Condition on return">
          <select
            className={inputClass}
            value={condition}
            onChange={(e) => setCondition(e.target.value as ItemCondition)}
          >
            <option value="new">New</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="damaged">Damaged</option>
          </select>
        </FormField>

        <FormField label="Notes (optional)">
          <textarea
            className={inputClass}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any damage or issues to flag?"
          />
        </FormField>

        {error && <p className="text-sm text-status-overdue mb-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="pressable w-full py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          {saving ? "Checking in…" : "Check in"}
        </button>
      </form>
    </Modal>
  );
}
