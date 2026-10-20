"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Category, TrackingType, ReturnType } from "@/types";
import { Select } from "@/components/common/Select";
import { Modal } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";

export function CategoryFormModal({
  category,
  onClose,
}: {
  category?: Category;
  onClose: () => void;
}) {
  const router = useRouter();
  const isEdit = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [trackingType, setTrackingType] = useState<TrackingType>(
    category?.trackingType ?? "individual"
  );
  const [returnType, setReturnType] = useState<ReturnType>(
    category?.returnType ?? "open-ended"
  );
  const [lowStockThreshold, setLowStockThreshold] = useState(
    category?.lowStockThreshold?.toString() ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      name,
      trackingType,
      returnType,
      lowStockThreshold:
        trackingType === "quantity" && lowStockThreshold
          ? Number(lowStockThreshold)
          : null,
    };

    const response = await fetch(
      isEdit ? `/api/categories/${category.id}` : "/api/categories",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      setError("Couldn't save category. Try again.");
      setSaving(false);
      return;
    }

    router.refresh();
    onClose();
  }

  return (
    <Modal title={isEdit ? "Edit category" : "New category"} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <FormField label="Name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Laptops"
            required
          />
        </FormField>

        <div className="mb-4">
          <Select
            label="Tracking type"
            value={trackingType}
            onChange={(e) => setTrackingType(e.target.value as TrackingType)}
            options={[
              { value: "individual", label: "Individual — each unit tracked separately" },
              { value: "quantity", label: "Quantity — tracked as a count" },
            ]}
          />
        </div>

        <div className="mb-4">
          <Select
            label="Return type"
            value={returnType}
            onChange={(e) => setReturnType(e.target.value as ReturnType)}
            options={[
              { value: "open-ended", label: "Open-ended — no fixed due date" },
              { value: "fixed-date", label: "Fixed date — due date required on checkout" },
            ]}
          />
        </div>

        {trackingType === "quantity" && (
          <FormField label="Low stock threshold">
            <input
              type="number"
              min="0"
              className={inputClass}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="e.g. 5"
            />
          </FormField>
        )}

        {error && <p className="text-sm text-status-overdue mb-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="pressable w-full py-2.5 rounded-lg bg-brand-yellow hover:brightness-105 text-brand-navy text-sm font-bold transition-all disabled:opacity-50 shadow-sm"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create category"}
        </button>
      </form>
    </Modal>
  );
}
